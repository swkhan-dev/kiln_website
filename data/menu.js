/*
 * Kiln & Crust — menu data.
 *
 * This is the ONLY file you need to edit to change dishes or prices.
 *   - price: a number in US dollars (e.g. 19 or 18.5). It is formatted automatically.
 *   - tags:  any of "veg", "vegan", "spicy", "gf" (labels are defined in `tags` below).
 *   - note:  optional line shown under a section heading.
 *
 * It is a .js file (not .json) so the site works when index.html is opened
 * directly from disk, without a local server.
 */
window.MENU = {
  tags: {
    veg: "Vegetarian",
    vegan: "Vegan",
    spicy: "Spicy",
    gf: "Gluten-free",
  },

  sections: [
    {
      id: "pizzas",
      title: "Pizzas",
      note: "12-inch, oak-fired, blistered in about 90 seconds. Gluten-free crust +$3.",
      items: [
        {
          name: "Margherita",
          desc: "San Marzano tomato, fior di latte, basil, Texas olive oil",
          price: 16,
          tags: ["veg"],
        },
        {
          name: "Ember Pepperoni",
          desc: "Cup-and-char pepperoni, Calabrian chili, hot honey, oregano",
          price: 19,
          tags: ["spicy"],
        },
        {
          name: "Brisket & Smoked Onion",
          desc: "Post-oak brisket, smoked mozzarella, charred onion, pickled jalapeño",
          price: 22,
          tags: ["spicy"],
        },
        {
          name: "Funghi Bianca",
          desc: "Roasted mushrooms, fontina, garlic cream, thyme, lemon zest",
          price: 19,
          tags: ["veg"],
        },
        {
          name: "Hatch & Fennel",
          desc: "Fennel sausage, Hatch green chile, whipped ricotta, red onion",
          price: 20,
          tags: ["spicy"],
        },
        {
          name: "Prosciutto & Arugula",
          desc: "Prosciutto di Parma, wild arugula, shaved parmesan, lemon oil",
          price: 21,
          tags: [],
        },
        {
          name: "Marinara",
          desc: "Tomato, shaved garlic, oregano, olive oil — the purist's pie",
          price: 13,
          tags: ["vegan"],
        },
      ],
    },
    {
      id: "small-plates",
      title: "Small Plates",
      items: [
        {
          name: "Fire-Roasted Olives",
          desc: "Citrus peel, chili, rosemary",
          price: 7,
          tags: ["vegan", "gf"],
        },
        {
          name: "Kiln Knots",
          desc: "Garlic dough knots, whipped ricotta, hot honey",
          price: 9,
          tags: ["veg"],
        },
        {
          name: "Burrata",
          desc: "Blistered cherry tomatoes, basil oil, ember-toasted bread",
          price: 15,
          tags: ["veg"],
        },
        {
          name: "Charred Broccolini",
          desc: "Anchovy breadcrumbs, chili, lemon",
          price: 11,
          tags: [],
        },
        {
          name: "Meatballs al Forno",
          desc: "Pork and beef, slow tomato, parmesan, grilled bread",
          price: 14,
          tags: [],
        },
      ],
    },
    {
      id: "salads",
      title: "Salads",
      items: [
        {
          name: "Little Gem Caesar",
          desc: "Anchovy dressing, smoked croutons, parmesan",
          price: 12,
          tags: [],
        },
        {
          name: "Smoked Beets",
          desc: "Goat cheese, pistachio, orange, mint",
          price: 13,
          tags: ["veg", "gf"],
        },
      ],
    },
    {
      id: "dessert",
      title: "Dessert",
      items: [
        {
          name: "Ember S'mores Skillet",
          desc: "Dark chocolate, torched marshmallow, graham crumble",
          price: 10,
          tags: ["veg"],
        },
        {
          name: "Olive Oil Cake",
          desc: "Candied citrus, mascarpone",
          price: 9,
          tags: ["veg"],
        },
        {
          name: "Affogato",
          desc: "Vanilla gelato, hot espresso",
          price: 7,
          tags: ["veg", "gf"],
        },
      ],
    },
    {
      id: "drinks",
      title: "Drinks",
      items: [
        {
          name: "Smoke & Honey Old Fashioned",
          desc: "Texas bourbon, smoked honey, orange bitters",
          price: 15,
          tags: [],
        },
        {
          name: "Blood Orange Spritz",
          desc: "Aperitivo, blood orange, prosecco",
          price: 13,
          tags: [],
        },
        {
          name: "House Wine",
          desc: "Red, white, or rosé by the glass — ask what's open",
          price: 12,
          tags: [],
        },
        {
          name: "Austin Draft",
          desc: "Rotating local tap",
          price: 8,
          tags: [],
        },
        {
          name: "Sparkling Lemonade",
          desc: "Rosemary, lemon, soda — zero proof",
          price: 6,
          tags: [],
        },
      ],
    },
  ],
};
