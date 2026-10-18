# Gem Cutting Pattern Dataset

Images used to train the gem cutting pattern recommendation model.

## Folder structure

```
dataset/
├── rough/
│   └── <gem_type>/        # rough (uncut) gem images
└── faceted/
    └── <gem_type>/        # cut / faceted gem images
```

`<gem_type>` is the class name (e.g. `sapphire`, `ruby`, `emerald`).

## Collecting images

- Capture rough and normal/cut gems under varied lighting and backgrounds.
- Keep one gem per image, reasonably centred.
- Use JPG or PNG.
- Aim for balanced classes (similar counts per gem type and state).

## Labeling format (CSV)

`labels.csv` (optional, for bookkeeping):

| column      | description                          |
|-------------|--------------------------------------|
| filename    | image file name                      |
| gem_type    | gem type class name                  |
| state       | `rough` or `cut`                     |
| pattern     | recommended cutting pattern id       |

Example:

```csv
filename,gem_type,state,pattern
sapphire_001.jpg,sapphire,rough,glass-shard-vortex
sapphire_002.jpg,sapphire,cut,glass-shard-vortex
```

## Splitting

```bash
python scripts/split_dataset.py
```

Creates `dataset_split/{train,val,test}/{rough,faceted}/<gem_type>/` with a 70/15/15 split.
