const TEN: f32 = 10.0;

pub fn approx_equals(a: &f32, b: &f32) -> bool {
    (a - b).abs() < TEN.powi(-5)
}

pub fn round(n: &f32, digits: i32) -> f32 {
    let scale = TEN.powi(digits);
    (n * scale).round() / scale
}

pub fn clamp(n: &i32, min: i32, max: i32) -> i32 {
    i32::min(i32::max(*n, min), max)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn approx_equals_works() {
        assert!(approx_equals(&0.000001, &0.000002),);
        assert!(!approx_equals(&0.001, &0.00002),);
    }

    #[test]
    fn round_works() {
        let number = 10.123123;

        assert!((round(&number, 10) - number).abs() < f32::EPSILON);
        assert!((round(&number, 1) - 10.1).abs() < f32::EPSILON);
    }

    #[test]
    fn clamp_works() {
        let number = 40;

        assert_eq!(clamp(&number, 10, 50), number);
        assert_eq!(clamp(&number, 10, 30), 30);
        assert_eq!(clamp(&number, 50, 60), 50);
    }
}
