import { Color, MeshBasicMaterial, NearestFilter } from 'three';

export function createMaterial_(materialName) {
  // Create material

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const scope = this;
  const mat = this.materialsInfo[materialName];
  const params: { [key: string]: any } = {
    name: materialName,
    side: this.side,
  };

  function resolveURL(baseUrl, url) {
    if (typeof url !== 'string' || url === '') return '';

    // Absolute URL
    if (/^https?:\/\//i.test(url)) return url;

    return baseUrl + url;
  }

  function setMapForType(mapType, value) {
    if (params[mapType]) return; // Keep the first encountered texture

    const texParams = scope.getTextureParams(value, params);
    const map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));

    map.repeat.copy(texParams.scale);
    map.offset.copy(texParams.offset);
    map.minFilter = NearestFilter;
    map.magFilter = NearestFilter;

    map.wrapS = scope.wrap;
    map.wrapT = scope.wrap;

    params[mapType] = map;
  }

  for (const prop in mat) {
    const value = mat[prop];
    let n;

    if (value === '') continue;

    switch (prop.toLowerCase()) {
      // Ns is material specular exponent

      case 'kd':
        // Diffuse color (color under white light) using RGB values

        params.color = new Color().fromArray(value);

        break;

      case 'ks':
        // Specular color (color when light is reflected from shiny surface) using RGB values
        params.specular = new Color().fromArray(value);

        break;

      case 'ke':
        // Emissive using RGB values
        params.emissive = new Color().fromArray(value);

        break;

      case 'map_kd':
        // Diffuse texture map

        setMapForType('map', value);

        break;

      case 'map_ks':
        // Specular map

        setMapForType('specularMap', value);

        break;

      case 'map_ke':
        // Emissive map

        setMapForType('emissiveMap', value);

        break;

      case 'norm':
        setMapForType('normalMap', value);

        break;

      case 'map_bump':
      case 'bump':
        // Bump texture map

        setMapForType('bumpMap', value);

        break;

      case 'map_d':
        // Alpha map

        setMapForType('alphaMap', value);
        params.transparent = true;

        break;

      case 'ns':
        // The specular exponent (defines the focus of the specular highlight)
        // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.

        params.shininess = parseFloat(value);

        break;

      case 'd':
        n = parseFloat(value);

        if (n < 1) {
          params.opacity = n;
          params.transparent = true;
        }

        break;

      case 'tr':
        n = parseFloat(value);

        if (this.options && this.options.invertTrProperty) n = 1 - n;

        if (n > 0) {
          params.opacity = 1 - n;
          params.transparent = true;
        }

        break;

      default:
        break;
    }
  }

  this.materials[materialName] = new MeshBasicMaterial(params);
  return this.materials[materialName];
}
