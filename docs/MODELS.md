# 3D models

Place the final files in `public/models/` with these exact names:

- Appliances: `fan.glb`, `ac.glb`, `fridge.glb`, `tv.glb`, `light.glb`, `washer.glb`, `geyser.glb`, `microwave.glb`
- House: `house.glb`
- Environment: `env.hdr`

Keep source exports in `public/models/raw/`, then run:

```sh
node scripts/optimize-models.mjs
```

The optimizer preserves mesh names and structure, compresses meshes with Meshopt, converts textures to WebP, and copies HDR files unchanged. Keep the combined optimized model and HDR size below **15 MB**. HDR files over 3 MB are flagged for manual resizing.

Add a credits sheet to `README.md` with each model's author, source URL, and license before shipping.
