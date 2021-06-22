use serde_json::Value;

pub fn merge(a: &mut Value, b: &Value, overwrite: bool) {
    match (a, b) {
        (&mut Value::Object(ref mut a), &Value::Object(ref b)) => {
            for (k, v) in b {
                let entry = a.entry(k.clone());

                if let serde_json::map::Entry::Occupied(_) = entry {
                    if !overwrite {
                        continue;
                    }
                }

                merge(a.entry(k.clone()).or_insert(Value::Null), v, overwrite);
            }
        }
        (a, b) => {
            *a = b.clone();
        }
    }
}
