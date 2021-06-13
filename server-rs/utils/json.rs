use std::fs::File;
use std::io::Read;

pub fn merge(a: &mut serde_json::Value, b: &serde_json::Value) {
    match (a, b) {
        (&mut serde_json::Value::Object(ref mut a), &serde_json::Value::Object(ref b)) => {
            for (k, v) in b {
                merge(a.entry(k.clone()).or_insert(serde_json::Value::Null), v);
            }
        }
        (a, b) => {
            *a = b.clone();
        }
    }
}

pub fn read_json_file(path: &str) -> Result<serde_json::Value, serde_json::Error> {
    let mut file = File::open(path).unwrap();
    let mut string = String::new();
    file.read_to_string(&mut string).unwrap();
    serde_json::from_str(&string)
}
