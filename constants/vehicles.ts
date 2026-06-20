export const VEHICLE_IMAGES: { [key: string]: any } = {
  "bigsuv_black.webp": require("@/assets/cars/bigsuv_black.webp"),
  "bigsuv_darkblue.webp": require("@/assets/cars/bigsuv_darkblue.webp"),
  "bigsuv_grey.webp": require("@/assets/cars/bigsuv_grey.webp"),
  "bigsuv_white.webp": require("@/assets/cars/bigsuv_white.webp"),
  "citycar_black.webp": require("@/assets/cars/citycar_black.webp"),
  "citycar_grey.webp": require("@/assets/cars/citycar_grey.webp"),
  "citycar_red.webp": require("@/assets/cars/citycar_red.webp"),
  "citycar_white.webp": require("@/assets/cars/citycar_white.webp"),
  "citycar_yellow.webp": require("@/assets/cars/citycar_yellow.webp"),
  "ecitycar_yellod.webp": require("@/assets/cars/ecitycar_yellod.webp"),
  "ehatchback_red.webp": require("@/assets/cars/ehatchback_red.webp"),
  "esedan_grey.webp": require("@/assets/cars/esedan_grey.webp"),
  "esuv_white.webp": require("@/assets/cars/esuv_white.webp"),
  "hatchback_black.webp": require("@/assets/cars/hatchback_black.webp"),
  "hatchback_grey.webp": require("@/assets/cars/hatchback_grey.webp"),
  "hatchback_red.webp": require("@/assets/cars/hatchback_red.webp"),
  "hatchback_white.webp": require("@/assets/cars/hatchback_white.webp"),
  "pickup_grey.webp": require("@/assets/cars/pickup_grey.webp"),
  "seda_grey.webp": require("@/assets/cars/seda_grey.webp"),
  "sport_orange.webp": require("@/assets/cars/sport_orange.webp"),
  "suv_black.webp": require("@/assets/cars/suv_black.webp"),
  "suv_darkblue.webp": require("@/assets/cars/suv_darkblue.webp"),
  "suv_grey.webp": require("@/assets/cars/suv_grey.webp"),
  "suv_white.webp": require("@/assets/cars/suv_white.webp"),
};

export const CAR_COLORS: { [key: string]: string } = {
  black: "#1A1A1A",
  darkblue: "#1E3A8A",
  grey: "#6B7280",
  white: "#E5E7EB", // slightly off-white for visibility
  yellow: "#FBBF24",
  yellod: "#FBBF24", // typo handle
  red: "#EF4444",
  orange: "#F97316",
};

export const VEHICLE_MODELS = [
  {
    id: "bigsuv",
    name: "SUV Grande",
    colors: ["black", "darkblue", "grey", "white"],
    defaultImage: "bigsuv_grey.webp"
  },
  {
    id: "citycar",
    name: "Carro de Ciudad",
    colors: ["black", "grey", "red", "white", "yellow"],
    defaultImage: "citycar_grey.webp"
  },
  {
    id: "ecitycar",
    name: "Eléctrico Ciudad",
    colors: ["yellod"],
    defaultImage: "ecitycar_yellod.webp"
  },
  {
    id: "ehatchback",
    name: "Eléctrico Hatchback",
    colors: ["red"],
    defaultImage: "ehatchback_red.webp"
  },
  {
    id: "esedan",
    name: "Eléctrico Sedán",
    colors: ["grey"],
    defaultImage: "esedan_grey.webp"
  },
  {
    id: "esuv",
    name: "SUV Eléctrica",
    colors: ["white"],
    defaultImage: "esuv_white.webp"
  },
  {
    id: "hatchback",
    name: "Hatchback",
    colors: ["black", "grey", "red", "white"],
    defaultImage: "hatchback_grey.webp"
  },
  {
    id: "pickup",
    name: "Pickup",
    colors: ["grey"],
    defaultImage: "pickup_grey.webp"
  },
  {
    id: "seda",
    name: "Sedán",
    colors: ["grey"],
    defaultImage: "seda_grey.webp"
  },
  {
    id: "sport",
    name: "Deportivo",
    colors: ["orange"],
    defaultImage: "sport_orange.webp"
  },
  {
    id: "suv",
    name: "SUV Mediana",
    colors: ["black", "darkblue", "grey", "white"],
    defaultImage: "suv_grey.webp"
  }
];
