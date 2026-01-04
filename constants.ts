
export const CARB_RULES_PROMPT = `
Use the following carbohydrate counting database. Each entry represents approximately 15g of carbohydrates (1 Carb Choice) unless otherwise specified.

CEREALS & GRAINS (≈15g CHO per serving):
* 1 Chapati (6" diameter, 22g raw atta)
* 1 Thepla (6" diameter, 22g raw)
* 1 Pav (30g)
* 1.25 slice Bread (30g)
* 1/2 cup Cooked Rice / Poha / Upma / Daliya
* 1/3 cup Cooked Rice (if 20g raw base)
* 1/2 cup Moong dal khichadi
* 1 small Dosa (10" diameter, 21g batter)
* 2 small Idlis (21g batter)
* 1 Bhakri (27g raw)
* 3/4 cup Cooked Oats (20g raw)
* 1/2 cup Cooked Millets (20g raw)
* 1/2 cup Pulav / Biryani (20g raw)
* 2 Puris (22g raw)
* 1/2 cup cooked Amaranth (Rajgeera)

PULSES & LEGUMES (≈15g CHO per serving):
* 1/2 cup Cooked Dal (Any)
* 1/2 cup Cooked Chhole / Rajma / Chawali / Sambar
* 2 small Moong/Besan Chilla
* 1/2 cup Sprouted Moong
* 1/3 cup Roasted Chana (25g)
* 1 cup Cooked Soyabean (70g raw)
* 2 cups Cooked Soya Chunks (45g raw)

BISCUITS (Quantity for ≈15g CHO):
* Parle-G: 4 nos
* Marie Gold: 4 nos
* Nutrichoice: 3 nos
* Monaco: 7 nos
* Digestive (High Fiber): 3 nos
* Nice: 3 nos
* Good Day Cashew: 3 nos
* Good Day Butter: 2 nos
* 50-50 Maska Chaska: 7 nos
* Bourbon: 1.5 biscuits
* Hide and Seek: 4 nos
* Dark Fantasy: 2 nos
* Oreo: 3 biscuits
* McVities Digestive: 1.3 biscuits
* Jeera Butter: 4 nos
* Khari: 1 no (9g CHO - count accordingly)
* Rusk: 1 no (8g CHO - count accordingly)

FRUITS (≈15g CHO per serving):
* Apple (100g / 1 medium)
* Guava (140g / 1 medium)
* Orange / Mosambi (140g-160g / 1 medium)
* Pomegranate (100g / 1 medium)
* Papaya (200g / 2 slices)
* Watermelon (450g / 3-4 slices)
* Muskmelon (430g / 3-4 slices)
* Pineapple (140g / 3 slices)
* Mango (90g / 2 slices)
* Grapes (90g / 12 nos)
* Chikoo (70g / 1 small)
* Banana (Elaichi): 1 no (55g)
* Plums: 2 small (130g)
* Peach / Kiwi: 1 small (100g-150g)
* Strawberries: 7-8 nos (150g)
* Dates: 2 nos (Note: 20g CHO)
* Raisins: 15g CHO is roughly 1-2 tbsp (Database mention 92g for specific context, but standard is ~20g)

VEGETABLES (1.5 cup raw or 1 cup cooked ≈ 15g CHO):
* Starchy Roots: Potato (66g raw / 1/3 cup cooked), Sweet Potato (50g raw / 1/4 cup cooked), Yam/Suran (80g raw / 1/2 cup cooked)
* Carrots: 140g raw / 1 cup cooked
* Beetroot: 170g raw / 1.25 cup cooked
* Radish: 440g
* Others: Ladies finger, Onion, Brinjal, Cauliflower, Cabbage, Beans, Gourds, Tomato.
* Leafy Greens: 500g raw ≈ 15g CHO.

SNACKS (Carbohydrates as specified):
* Dhokla (2 pieces): 15g CHO
* Khandvi (12 medium pieces): 15g CHO
* Muthiya (3 small): 15g CHO
* Samosa (1 no): 30g CHO
* Vada (1 no): 20g CHO
* Veg Pizza (1 slice 6"): 30g CHO
* Veg Frankie/Wrap/Roll (1 no): 35g CHO
* Chicken Frankie/Wrap (1 no): 25g CHO
* French Fries (20 nos): 15g CHO
* Pani Puri (6 nos): 31g CHO
* Dahi Puri (6 nos): 31g CHO
* Bhel Puri (1 cup): 26g CHO
* Sev Puri (5 puris): 33g CHO
* Bread Pakoda (1 no): 24g CHO
* Aloo Tikki (1 patty): 15g CHO
* Dahi Wada (1 no): 22g CHO
* Grilled Sandwich (Potato filling): 30g CHO
* Cheese Sandwich (2 slices): 22g CHO
* Veg Cutlet (1 no): 15g CHO
* Banana Chips (20 chips): 15g CHO
* Onion Pakoda (4 nos): 15g CHO
* Masala Peanuts (50g): 7g CHO
* Chakali (1 no): 7g CHO

SWEETS (Carbohydrates as specified):
* Gulab Jamun (1 small): 15g CHO
* Rasgollah (1 medium): 15g CHO
* Rasmalai (1 small): 15g CHO
* Jalebi (1 no): 15g CHO
* Ladoo (1/2 small): 15g CHO
* Shrikhand (1/4 cup): 15g CHO
* Ice-cream (1/4 cup): 15g CHO
* Kulfi (1 cup): 15g CHO
* Brownie (2"): 15g CHO
* Cup cake (1 small): 15g CHO
* Carrot Halwa (1/3 cup): 15g CHO
* Sooji Halwa (1/4 cup): 15g CHO
* Mohanthal (1 piece): 15g CHO
* Puranpoli (1/4 piece): 15g CHO

DAIRY:
* Milk: 200ml (1 glass) ≈ 10g-15g CHO
* Curd: 300g ≈ 15g CHO
* Paneer: Negligible CHO

NEGLIGIBLE / LOW CARB (0-5g):
* Eggs, Meat, Fish, Paneer, Fats (Butter, Ghee, Oil), Spices.
* Nuts (Carbs for 15g CHO weight): Cashews (67g), Peanuts (58g), Walnuts (136g), Almonds (143g), Pistachios (92g), Flaxseeds (50g), Sunflower seeds (84g).
`;

export const CORRECTION_TABLE = [
  { min: 0, max: 89, dose: -1 },
  { min: 90, max: 145, dose: 0 },
  { min: 146, max: 180, dose: 1 },
  { min: 181, max: 270, dose: 2 },
  { min: 271, max: 9999, dose: 3 },
];
