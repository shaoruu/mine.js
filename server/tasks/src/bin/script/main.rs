use server_common::noise::Noise;

fn main() {
    let noise = Noise::new(123);

    let mut sum = 0.0;
    let side = 100;

    for vx in -side..side {
        for vz in -side..side {
            let val = noise.fractal_octave_perlin2(vx as f64, vz as f64, 0.001, 2);
            println!("{:?} {}", sum, val);
            sum += val;
        }
    }

    println!("{}, {:?}", sum, sum / (side as f64).powi(2));
}
