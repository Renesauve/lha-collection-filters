# Lighthouse Aquatics — Filtered Collection Pages

## How It Works

The filter system lets you create pages like "Live Corals" that pull products from **multiple Lightspeed categories** and display them with clickable sub-filters (LPS, SPS, Acropora, Torch, etc.) — just like Top Shelf Aquatics.

**The filters work by matching keywords in product names.** For example, clicking "Torch" shows all products with "torch" in the name. Clicking "LPS Corals" shows everything in the Corals LPS category.

---

## Step 1: Create the Collection Page in Lightspeed

1. Go to **Lightspeed E-Commerce → Online Store → Website**
2. Create a new page with the URL slug that matches the filter config:
   - `live-corals` → shows all corals with sub-filters
   - `all-fish` → shows all fish & inverts with sub-filters
   - `aquarium-supplies` → shows all supplies with sub-filters
3. The page content doesn't matter much — the script will replace the product grid with the filtered version
4. Add the page to your navigation menu (the mega nav already links to these)

---

## Step 2: Product Naming (IMPORTANT)

The sub-filters work by matching **keywords in the product name**. This means product names need to include the coral/fish type somewhere in the name.

### Coral Naming Examples

| Product Name | Will appear under these filters |
|---|---|
| `Gold Hammer AUS` | LPS Corals, Hammer |
| `Rainbow Acro Frag` | SPS Corals, Acropora |
| `Zoanthid Sunny Delight` | Soft Corals, Zoanthids |
| `Green Toadstool XLG` | Soft Corals, Leather |
| `Blue Mushroom` | Soft Corals, Mushrooms |
| `Chalice Solar Flare` | Chalice |
| `Frogspawn Gold Indo` | LPS Corals, Frogspawn |
| `Montipora Orange` | SPS Corals, Montipora |
| `Bubble Anemone White Tip` | Anemones |

### Keywords the filters look for

| Filter | Keywords matched (case-insensitive) |
|---|---|
| **LPS Corals** | Anything in the "Corals LPS" Lightspeed category |
| **SPS Corals** | Anything in the "Corals SPS" Lightspeed category |
| **Soft Corals** | Anything in the "Corals Soft" Lightspeed category |
| **Acropora** | `acro` |
| **Chalice** | `chalice` |
| **Torch** | `torch` |
| **Hammer** | `hammer` |
| **Frogspawn** | `frogspawn` |
| **Goniopora** | `goniopora`, `goni` |
| **Montipora** | `montipora`, `monti` |
| **Zoanthids** | `zoanthid`, `zoa` |
| **Mushrooms** | `mushroom`, `shroom` |
| **Leather** | `leather`, `toadstool` |
| **Anemones** | `anemone` |
| **Blastos** | `blasto` |

### Tips for naming products

- **Always include the coral type** somewhere in the name
- Abbreviations work: `Acro` matches "Acropora", `Zoa` matches "Zoanthids", `Monti` matches "Montipora"
- **Order doesn't matter**: "Gold Hammer AUS" and "Hammer Gold AUS" both work
- **The Lightspeed category still matters** for the broad filters (LPS/SPS/Soft) — make sure the product is in the right category

---

## Step 3: Categories Still Matter

Each product must still be in **one Lightspeed category**. The broad filters (LPS Corals, SPS Corals, Soft Corals) use the category. The specific filters (Torch, Acropora, etc.) use the product name.

Current categories:
- **Corals LPS** (128 products) — for LPS corals
- **Corals SPS** (35 products) — for SPS corals
- **Corals Soft** (62 products) — for soft corals

---

## Step 4: Adding the Script

Add this single line to **Lightspeed → Online Store → Website → Custom JavaScript**:

```html
<script src="https://YOUR-HOSTED-URL/lighthouse-filters.js"></script>
```

(The developer will set up hosting and provide the final URL.)

---

## Adding New Filters

If you want to add a new sub-filter (e.g., "Duncan" or "Elegance"), let the developer know. They just need to add one line to the config. As long as the keyword appears in the product names, it will work.

---

## FAQ

**Q: A product isn't showing up under the right filter.**
A: Check the product name — it needs to contain the keyword. For example, a torch coral named "Rainbow Indo" won't appear under the Torch filter. Rename it to "Rainbow Torch Indo".

**Q: A product shows up under multiple filters.**
A: That's by design! A "Zoanthid Mushroom Rock" would appear under both Zoanthids and Mushrooms. If that's not desired, adjust the product name.

**Q: Can we add a "WYSIWYG" or "Signature" filter?**
A: Yes — just add "WYSIWYG" or "Signature" to the product names, and ask the developer to add the filter. Or we can create a dedicated Lightspeed category for it.

**Q: How many products can this handle?**
A: It fetches in batches of 100 and handles pagination automatically. 1,000+ products is fine.

**Q: Do products need images?**
A: Products without images will show a blank placeholder. Upload images in Lightspeed for them to appear.
