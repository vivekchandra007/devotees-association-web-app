export default function getCountryCallingCode(countryName: string): string | undefined {
    const countryCallingCodes: Record<string, string> = {
        afghanistan: "93",
        albania: "355",
        algeria: "213",
        andorra: "376",
        angola: "244",
        argentina: "54",
        armenia: "374",
        australia: "61",
        austria: "43",
        azerbaijan: "994",
        bahrain: "973",
        bangladesh: "880",
        belarus: "375",
        belgium: "32",
        bhutan: "975",
        bolivia: "591",
        "bosnia and herzegovina": "387",
        brazil: "55",
        bulgaria: "359",
        cambodia: "855",
        cameroon: "237",
        canada: "1",
        chile: "56",
        china: "86",
        colombia: "57",
        croatia: "385",
        cuba: "53",
        cyprus: "357",
        czechia: "420",
        denmark: "45",
        egypt: "20",
        estonia: "372",
        finland: "358",
        france: "33",
        georgia: "995",
        germany: "49",
        greece: "30",
        hungary: "36",
        iceland: "354",
        india: "91",
        indonesia: "62",
        iran: "98",
        iraq: "964",
        ireland: "353",
        israel: "972",
        italy: "39",
        japan: "81",
        jordan: "962",
        kazakhstan: "7",
        kenya: "254",
        kuwait: "965",
        kyrgyzstan: "996",
        laos: "856",
        latvia: "371",
        lebanon: "961",
        lithuania: "370",
        luxembourg: "352",
        malaysia: "60",
        maldives: "960",
        mexico: "52",
        mongolia: "976",
        morocco: "212",
        nepal: "977",
        netherlands: "31",
        "new zealand": "64",
        nigeria: "234",
        "north korea": "850",
        norway: "47",
        oman: "968",
        pakistan: "92",
        palestine: "970",
        peru: "51",
        philippines: "63",
        poland: "48",
        portugal: "351",
        qatar: "974",
        romania: "40",
        russia: "7",
        "saudi arabia": "966",
        serbia: "381",
        singapore: "65",
        slovakia: "421",
        slovenia: "386",
        "south africa": "27",
        "south korea": "82",
        spain: "34",
        "sri lanka": "94",
        sweden: "46",
        switzerland: "41",
        syria: "963",
        taiwan: "886",
        tajikistan: "992",
        tanzania: "255",
        thailand: "66",
        tunisia: "216",
        turkey: "90",
        turkmenistan: "993",
        "united arab emirates": "971",
        "united kingdom": "44",
        "united states": "1",
        ukraine: "380",
        uzbekistan: "998",
        venezuela: "58",
        vietnam: "84",
        yemen: "967",
        zambia: "260",
        zimbabwe: "263",
    };

    const key = countryName.trim().toLowerCase();
    return countryCallingCodes[key];
}