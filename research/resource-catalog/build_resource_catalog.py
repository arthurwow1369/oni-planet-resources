#!/usr/bin/env python3
"""Build the bilingual curated catalog for every worldgen resource currently displayed."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "research/resource-catalog/resource-catalog.json"
ENTITY_PROFILES = ROOT / "research/terrain-research/entity-profiles.json"
CATALOG_UPDATED_AT = "2026-08-02"
entries: dict[str, dict[str, object]] = {}


def add(
    simhash: str,
    name_en: str,
    name_zh: str,
    kind: str,
    categories: list[str],
    use_en: str,
    use_zh: str,
) -> None:
    entries[simhash] = {
        "name_en": name_en,
        "name_zh": name_zh,
        "type": kind,
        "categories": categories,
        "use_en": use_en,
        "use_zh": use_zh,
    }


def alias(simhash: str, parent: str, name_en: str, name_zh: str) -> None:
    value = dict(entries[parent])
    value["name_en"] = name_en
    value["name_zh"] = name_zh
    entries[simhash] = value


# Elements and construction resources.
add("Algae", "Algae", "藻類", "solid", ["oxygen", "food"], "Feed an Oxygen Diffuser or Algae Terrarium for early oxygen; Pacu also eat it. It is finite unless renewed through slime or space sources.", "可供氧氣擴散器或藻類箱早期製氧，帕庫也會食用。除非由軟泥或太空來源補充，否則屬有限資源。")
add("AluminumOre", "Aluminum Ore", "鋁礦", "solid", ["industrial"], "Refine into aluminum, an excellent heat-conducting metal for radiant pipes, metal tiles and thermal machinery.", "可精煉成鋁；鋁導熱優秀，適合輻射管、金屬磚與熱能設備。")
add("Basalt", "Basalt", "玄武岩", "solid", ["industrial"], "A high-temperature raw mineral for construction and bulk thermal mass. Preserve better insulating materials for places where heat transfer matters.", "耐高溫的建築原礦，可作大量熱容量材料；需要隔熱時應保留更合適的材料。")
add("BleachStone", "Bleach Stone", "漂白石", "solid", ["industrial", "food"], "Off-gasses chlorine and fertilizes Waterweed; it also supports sanitation and bleach-stone production chains. Store it in liquid or sealed chlorine to prevent mass loss.", "會逸散氯氣，也是水草肥料，並用於消毒及漂白石生產鏈。宜浸液或密封於氯氣中，避免逸散損失。")
add("Brine", "Brine", "濃鹽水", "liquid", ["liquid", "food", "oxygen"], "Desalinate into water and salt; the water can support crops or electrolysis. Freezing separates useful temperature and phase-change opportunities.", "可淡化成水與鹽；所得水可灌溉或電解製氧。其凝固與融化也能用於溫控與相變處理。")
add("BrineIce", "Brine Ice", "濃鹽水冰", "solid", ["liquid", "oxygen"], "Melt into brine, then desalinate for water and salt. It is also a portable cold reserve, so control where it melts.", "融化後成為濃鹽水，再淡化可得水與鹽；也是可搬運的冷量來源，需控制融化位置。")
add("Carbon", "Coal", "煤炭", "solid", ["power", "industrial"], "Fuel for Coal Generators and a kiln input. Hatch ranches can renew it, but generators emit carbon dioxide and substantial heat.", "煤炭發電機燃料及窯爐原料；可由哈奇牧場再生，但發電會排放二氧化碳與大量熱。")
add("CarbonDioxide", "Carbon Dioxide", "二氧化碳", "gas", ["gas", "food", "oxygen"], "Feeds Oxyferns, Alveo Veras and Slicksters, and creates sterile food storage. It is not breathable and settles in low areas; skim or pump excess.", "可供氧氣蕨、多孔蘆薈與浮油生物使用，也可形成無菌食物環境。不可呼吸且會沉積低處，過量時需撇除或抽走。")
add("Chlorine", "Liquid Chlorine", "液氯", "liquid", ["liquid", "industrial"], "A cryogenic chlorine phase used mainly for storage or thermal designs before warming back into chlorine gas. It is extremely cold and phase changes can break pipes.", "氯的低溫液相，主要用於儲存或熱力設計，升溫後會成氯氣。溫度極低，發生相變時可能損壞管線。")
add("ChlorineGas", "Chlorine Gas", "氯氣", "gas", ["gas", "industrial", "food"], "Kills exposed germs, supports Dasha Saltvines and some ranching chains, and preserves food atmospheres. It is unbreathable and does not disinfect material inside pipes or solid tiles.", "可殺死暴露其中的病菌，供沙鹽藤及部分牧場鏈使用，也能作食物保存氣氛。不可呼吸，且不會消毒管內物質或實心磚內部。")
add("Cinnabar", "Cinnabar Ore", "辰砂", "solid", ["industrial"], "Mercury-bearing ore from cold regions; process it when mercury or its specialized low-temperature material properties are required.", "寒冷地區的含汞礦石；需要汞或其特殊低溫材料性質時再加工。")
add("Clay", "Clay", "黏土", "solid", ["industrial"], "Fire it with coal in a Kiln to make Ceramic, a strong insulation and high-temperature construction material. Deodorizers can renew clay from polluted oxygen and sand.", "可與煤炭在窯爐燒製陶瓷，供隔熱及高溫建築使用。除臭器能以汙氧與沙子持續產出黏土。")
add("Cobaltite", "Cobalt Ore", "鈷礦", "solid", ["industrial"], "Refine into cobalt for machinery and heat-transfer construction. Compare its temperature properties with aluminum before committing scarce ore.", "可精煉成鈷，供機械與熱傳建築使用；消耗稀有礦石前應與鋁的溫度性能比較。")
add("ContaminatedOxygen", "Polluted Oxygen", "汙氧", "gas", ["oxygen", "gas", "industrial"], "Duplicants can breathe it, but it can carry Slimelung and irritants. Deodorize it into clean oxygen and clay, or feed Pufts where disease control is established.", "複製人可呼吸，但可能帶有黏液肺病菌及刺激物。可除臭成氧氣與黏土，或在妥善防疫後供帕夫食用。")
add("Coquina", "Coquina", "殼灰岩", "solid", ["industrial"], "A shell-rich Aquatic raw mineral. Use it for construction or process it when lime-bearing material is needed for steel production.", "水族包的富含貝殼原礦；可作建材，或在製鋼需要含石灰材料時加工。")
add("Corallium", "Corallium", "紅珊瑚", "solid", ["industrial", "decoration"], "Aquatic coral material used in specialized construction and processing chains. Treat deposits as finite until a renewable coral source is secured.", "水族包的珊瑚材料，可用於特殊建築與加工鏈；在建立可再生珊瑚來源前應視為有限資源。")
add("CrudeOil", "Crude Oil", "原油", "liquid", ["power", "liquid", "industrial"], "Refine into petroleum for power, plastic and rockets, or boil it for higher-yield petroleum. Oil systems produce heat and carbon-heavy byproducts.", "可精煉成石油，用於發電、塑膠與火箭；亦可加熱裂解以提高產率。原油系統會產生熱與含碳副產物。")
add("CrushedIce", "Crushed Ice", "碎冰", "solid", ["liquid", "industrial"], "Melts into water while absorbing heat. It is useful for emergency cooling or water delivery, but loose piles may melt in unwanted locations.", "融化成水時可吸熱，適合緊急降溫或搬運供水；散落堆積可能在不希望的位置融化。")
add("Cuprite", "Copper Ore", "銅礦", "solid", ["industrial"], "A common metal ore for early wires, automation and machinery; refine it into copper when refined-metal recipes or better decor are required.", "常見的早期金屬礦，可製電線、自動化與機械；需要精煉金屬配方或較佳裝飾時再精煉成銅。")
add("Diamond", "Diamond", "鑽石", "solid", ["industrial", "decoration", "lateGame"], "Consumed by drillcones and used for high-conductivity Tempshift Plates, Window Tiles and decor. Keep a reserve for space mining.", "鑽頭會消耗鑽石，也可製高導熱變溫板、窗戶磚與裝飾品；應為太空採礦保留庫存。")
add("Dirt", "Dirt", "泥土", "solid", ["food", "industrial"], "Fertilizes Mealwood, Sleet Wheat and other crops and feeds Sage Hatches. Compost, mud processing and Pip ranches can replenish it; monitor long-term farm demand.", "是米虱木、雪地小麥等作物的肥料，也可餵賢者哈奇。堆肥、泥漿加工及樹鼠牧場可補充，需監控長期農業消耗。")
add("DirtyIce", "Polluted Ice", "汙冰", "solid", ["liquid", "oxygen"], "Melts into polluted water, a source of irrigation, coolant and filtered water. It can release germs and should be melted in a controlled basin.", "融化成汙水，可供灌溉、冷卻或過濾成水；可能帶菌，應在受控槽體中融化。")
add("DirtyWater", "Polluted Water", "汙水", "liquid", ["oxygen", "liquid", "food"], "Off-gasses polluted oxygen, irrigates several crops and can be sieved into water. Control germs and heat before routing the output to food or oxygen systems.", "會逸散汙氧，可灌溉多種作物，也能過濾成水；輸往食物或製氧系統前需處理病菌與熱量。")
add("Ethanol", "Ethanol", "乙醇", "liquid", ["power", "liquid", "food"], "Burn it in Petroleum Generators and use it as a cold-range coolant or Nosh Sprout irrigation. The production and generator chain emits carbon dioxide and polluted water.", "可供石油發電機燃燒，也可作低溫冷媒或灌溉小吃芽。生產與發電鏈會排放二氧化碳及汙水。")
add("Fertilizer", "Fertilizer", "肥料", "solid", ["food", "industrial"], "Consumed by Farm Stations to apply Farmer's Touch and accelerate crop growth. Production costs polluted water, dirt and phosphorite, so boost only worthwhile crops.", "農業站會消耗肥料施加「農夫之觸」以加速作物；生產需汙水、泥土與磷礦，宜只強化值得的作物。")
add("Fossil", "Fossil", "化石", "solid", ["industrial"], "Crush into lime, then combine lime with iron and refined carbon to make steel. Fossil deposits are a key early steel bottleneck.", "可粉碎成石灰，再與鐵及精煉碳製成鋼；化石礦床常是早期製鋼瓶頸。")
add("Galena", "Galena", "方鉛礦", "solid", ["industrial"], "Lead-bearing Aquatic ore for refined-metal production. Lead is useful for cheap automation and radiation shielding but melts easily.", "水族包的含鉛礦石，可加工為精煉金屬；鉛適合低成本自動化及輻射屏蔽，但熔點很低。")
add("GoldAmalgam", "Gold Amalgam", "金汞齊", "solid", ["industrial", "decoration"], "Build machinery with a useful overheat-temperature bonus or refine it into gold for decor and refined-metal recipes. Ore availability is usually limited.", "製作機械時可提高過熱溫度，或精煉成金供裝飾與精煉金屬配方；礦量通常有限。")
add("Granite", "Granite", "花崗岩", "solid", ["industrial", "decoration"], "Strong raw mineral with a decor bonus, ideal for ladders, tiles and statues in occupied areas. Its thermal conductivity is not insulation-grade.", "堅固且有裝飾加成，適合生活區的梯子、磚與雕像；導熱性能不適合作真正隔熱層。")
add("Graphite", "Graphite", "石墨", "solid", ["lateGame", "industrial"], "Process through the molecular-forge chain toward Fullerene and Super Coolant. Avoid spending rare graphite as ordinary construction material.", "可經分子鍛造鏈製成富勒烯與超級冷卻液；不應把稀有石墨浪費在一般建築。")
add("Hydrogen", "Hydrogen Gas", "氫氣", "gas", ["power", "gas", "lateGame"], "Burn in Hydrogen Generators, use in Drecko ranch atmospheres and liquefy for advanced rockets. It rises and is highly thermally conductive, so capture it above electrolyzers.", "可供氫氣發電機、龍鱗蜥牧場氣氛，並液化作進階火箭燃料。氫氣上浮且導熱高，宜在電解器上方收集。")
add("Ice", "Ice", "冰", "solid", ["liquid", "oxygen", "food"], "Melt for water while absorbing heat; Ice-E Fans provide local cooling. Plan drainage because mined ice loses mass and may melt during transport.", "融化可得水並吸熱，也可供冰冷風扇局部降溫。開採會損失質量，運送途中也可能融化，需先規劃排水。")
add("IgneousRock", "Igneous Rock", "火成岩", "solid", ["industrial"], "Abundant construction mineral and Stone Hatch feed; also a practical pipe and tile material. It is only moderately insulating despite common use in insulated builds.", "常見建材，也是石殼哈奇飼料，適合一般管線與磚；雖常用於隔熱建築，但本身僅屬中等隔熱。")
add("Iron", "Iron", "鐵", "solid", ["industrial"], "Refined metal for machinery and the main metal input to steel. Reserve enough for steel before using large quantities in ordinary wiring or decor.", "精煉金屬，可製機械，也是鋼的主要金屬原料；大量用於一般電線或裝飾前應先保留製鋼量。")
add("IronOre", "Iron Ore", "鐵礦", "solid", ["industrial"], "Build early machinery directly or refine into iron for advanced equipment and steel. Metal Refineries recover more metal than Rock Crushers.", "可直接製作早期機械，或精煉成鐵供進階設備與鋼；金屬精煉器的金屬回收率高於碎石機。")
add("Katairite", "Abyssalite", "深淵水晶", "solid", ["lateGame", "industrial"], "Naturally insulates biome boundaries and normally cannot be used for construction. Extreme late-game melting can convert it toward tungsten, but ordinary mining destroys much of its value.", "天然隔開生態區，通常不能作建材。極後期可用極端高溫熔融取得鎢鏈資源，但一般開採價值有限。")
add("Lead", "Lead", "鉛", "solid", ["industrial", "radiation"], "A plentiful refined metal for automation, conductive wires and radiation shielding. Its very low melting point makes it unsafe near hot machinery.", "常見精煉金屬，適合自動化、導線與輻射屏蔽；熔點極低，不可用於高溫機械附近。")
add("LiquidOxygen", "Liquid Oxygen", "液氧", "liquid", ["oxygen", "liquid", "lateGame"], "A cryogenic oxidizer for high-performance rockets. It requires deep cooling and insulated plumbing; any warming causes pipe-breaking phase change.", "高性能火箭的低溫氧化劑；需要深度冷卻與隔熱管路，升溫相變會導致管線破裂。")
add("MaficRock", "Mafic Rock", "基性岩", "solid", ["industrial"], "Common surface and space construction mineral. Use it as expendable bulk material where stronger decor, insulation or conductivity is unnecessary.", "常見於地表與太空的建築原礦；在不需要高裝飾、隔熱或導熱時可作消耗性大量建材。")
add("Magma", "Magma", "岩漿", "liquid", ["power", "liquid", "industrial"], "A massive heat source for steam-turbine geothermal power and igneous-rock production. Containment failures are catastrophic; use vacuum, insulated barriers and controlled heat exchangers.", "可供蒸汽渦輪地熱發電並產生火成岩。圍堵失敗後果嚴重，應使用真空、隔熱屏障與受控熱交換器。")
add("Mud", "Mud", "泥漿", "solid", ["food", "liquid", "industrial"], "Process in a Sludge Press into dirt and water, supporting farms and oxygen systems. Automation prevents duplicants from spending excessive labor on hauling.", "可在污泥壓榨器分離成泥土與水，支援農業及製氧；自動化可減少複製人大量搬運時間。")
add("MurkyBrine", "Polluted Brine", "汙染濃鹽水", "liquid", ["liquid", "food", "oxygen"], "A contaminated saline liquid accepted by several Aquatic plants. Treat or separate it before using the recovered water in sensitive food and oxygen loops.", "受汙染的鹽水，可供數種水族植物生長；回收水進入敏感的食物或製氧循環前應先處理或分流。")
add("NickelOre", "Nickel Ore", "鎳礦", "solid", ["industrial"], "Refine into nickel for specialized construction and alloy chains introduced with Prehistoric content. Keep a strategic stock instead of using it as generic ore.", "可精煉成鎳，供史前內容的特殊建築與合金鏈；宜保留戰略庫存，不要當一般礦石消耗。")
add("Niobium", "Niobium", "鈮", "solid", ["lateGame", "industrial"], "Alloy with tungsten into Thermium for extreme-temperature machinery. It is a rare space material, so bootstrap a renewable Thermium/niobium loop before broad use.", "可與鎢製成導熱質，供極端高溫機械；屬稀有太空材料，廣泛使用前宜先建立可再生循環。")
add("Obsidian", "Obsidian", "黑曜石", "solid", ["industrial"], "Very high-melting raw mineral for hot-area construction and magma contact. It is not a true insulator, so use insulated tiles or vacuum for heat isolation.", "熔點極高，適合高溫區與岩漿接觸建築；並非真正隔熱材，隔熱仍應使用隔熱磚或真空。")
add("OxyRock", "Oxylite", "氧石", "solid", ["oxygen", "industrial"], "Off-gasses breathable oxygen and serves as a rocket oxidizer. Store at high gas pressure or submerged to prevent unwanted mass loss.", "會逸散可呼吸氧氣，也可作火箭氧化劑；應存於高氣壓或浸液環境，避免非預期逸散損失。")
add("Oxygen", "Oxygen", "氧氣", "gas", ["oxygen", "gas"], "Primary breathable gas for duplicants and some Aquatic systems. Maintain pressure and temperature, and separate it from hydrogen or contaminants when designs depend on pure gas.", "複製人的主要可呼吸氣體，也供部分水族系統使用。需維持壓力與溫度；要求純氣時應與氫氣及汙染物分離。")
add("Peat", "Peat", "泥炭", "solid", ["power", "industrial"], "Renewable solid fuel produced by Lumbs from suitable plant food. It can supplement coal power, but ranch space and feed supply determine true output.", "可由隆布食用適當植物食物後再生的固體燃料，可補充煤電；實際產量受牧場空間與飼料供應限制。")
add("Phosphorite", "Phosphorite", "磷礦", "solid", ["food", "industrial", "radiation"], "Fertilizes Pincha Pepperplants and Wheezeworts, feeds Dreckos, and can become phosphorus for Shine Bug morphs. Ranching provides a renewable source.", "可施肥火椒藤與冰樹、餵龍鱗蜥，也能轉為磷以培育發光蟲變種；牧場可提供再生來源。")
add("Regolith", "Regolith", "表土", "solid", ["industrial"], "A falling filtration medium and Shove Vole food found at the surface. It arrives extremely hot and can bury equipment, but also offers heat and filtration opportunities.", "地表常見的落砂型過濾介質，也是尖嗓田鼠飼料。通常非常熱且會掩埋設備，但也可利用其熱量與過濾性。")
add("Rust", "Rust", "鐵鏽", "solid", ["oxygen", "industrial"], "Feed a Rust Deoxidizer with salt to produce oxygen, chlorine and iron ore. The oxygen chain is finite unless rust is renewed through space or other sources.", "與鹽一起供除鏽機，可產生氧氣、氯氣與鐵礦。除非由太空或其他來源補充，這條製氧鏈屬有限資源。")
add("Salt", "Salt", "鹽", "solid", ["food", "industrial", "oxygen"], "Used with rust for oxygen, crushed into table salt for morale, and involved in saline processing. Desalinators provide a renewable stream when salt water or brine is renewable.", "可與鐵鏽製氧，也可磨成食鹽提高士氣，並參與鹽水加工；若鹽水或濃鹽水可再生，淡化器能持續產鹽。")
add("SaltWater", "Salt Water", "鹽水", "liquid", ["liquid", "food", "oxygen"], "Desalinate into water and salt and use directly for Waterweed or compatible Aquatic crops. Pumping and desalination add power and heat costs.", "可淡化成水與鹽，也可直接供水草或相容水族作物；抽水與淡化會增加耗電及熱量。")
add("Sand", "Sand", "沙子", "solid", ["industrial", "oxygen"], "Filtration medium for Water Sieves and Deodorizers and feedstock for Glass Forges. Secure renewable sand before committing to large polluted-water loops.", "水篩與除臭器的過濾介質，也是玻璃熔爐原料；建立大型汙水循環前應先確保可再生沙源。")
add("SandStone", "Sandstone", "砂岩", "solid", ["industrial"], "Early general-purpose construction mineral and Hatch feed. Use it freely for ladders and tiles, while reserving specialty minerals for thermal jobs.", "早期通用建材，也是哈奇飼料；適合梯子與磚，特殊礦物則留給熱能用途。")
add("SedimentaryRock", "Sedimentary Rock", "沉積岩", "solid", ["industrial"], "Construction mineral that encourages Hatches toward the Stone Hatch morph. It is strategically useful for establishing renewable coal ranches.", "可作建材，並促使哈奇轉化為石殼哈奇；建立可再生煤炭牧場時很有戰略價值。")
add("Shale", "Shale", "頁岩", "solid", ["industrial"], "A bulk raw mineral for construction in Prehistoric regions. Prefer it for ordinary structures while conserving metal and specialty thermal materials.", "史前地區的大量建築原礦；一般結構優先使用頁岩，可節省金屬與特殊熱材。")
add("SiltStone", "Siltstone", "粉砂岩", "solid", ["industrial"], "General raw mineral for construction and thermal mass. It has no major advanced chain, making it a practical expendable building material.", "一般建築與熱容量用原礦，沒有重要進階生產鏈，適合作可消耗建材。")
add("SlimeMold", "Slime", "軟泥", "solid", ["oxygen", "industrial", "food"], "Distill into algae and polluted water, or let it off-gas polluted oxygen. It can contain Slimelung; store submerged and process behind hygiene controls.", "可蒸餾成藻類與汙水，也會逸散汙氧。可能含黏液肺病菌，宜浸液儲存並在衛生管制下加工。")
add("Snow", "Snow", "雪", "solid", ["liquid", "food", "oxygen"], "Melts into water and provides portable cooling. Its low mass per tile makes it a modest water source; prevent accidental thawing over sensitive machinery.", "融化成水並可搬運冷量；單格質量較低，供水量有限，應避免在敏感機械上方意外融化。")
add("SolidCarbonDioxide", "Solid Carbon Dioxide", "固態二氧化碳", "solid", ["gas", "food", "oxygen"], "Warms into carbon dioxide for Slicksters, Oxyferns, Alveo Veras or sterile storage. Sublimation can rapidly raise local gas pressure.", "升溫後成為二氧化碳，可供浮油生物、氧氣蕨、多孔蘆薈或無菌儲存；昇華可能快速提高局部氣壓。")
add("SolidChlorine", "Solid Chlorine", "固態氯", "solid", ["gas", "industrial"], "A cryogenic chlorine phase that becomes liquid and then gas as it warms. Use only in controlled thermal storage because phase changes can displace mass and damage pipes.", "氯的低溫固相，升溫後依序成液體與氣體；只宜在受控熱儲存中使用，以免相變位移物質或損壞管線。")
add("SolidCrudeOil", "Solid Crude Oil", "固態原油", "solid", ["power", "liquid", "industrial"], "Melt into crude oil before refining or boiling toward petroleum. It is mainly a cold-region oil reserve and must be thawed without overheating the target system.", "融化成原油後可精煉或加熱成石油；主要是寒區油儲備，解凍時需避免讓目標系統過熱。")
add("SolidMercury", "Mercury", "汞", "solid", ["industrial"], "A refined metal with an exceptionally low melting point and specialized cold-biome uses. Never select it for hot wires or machinery where it can liquefy.", "熔點極低的精煉金屬，適合特定寒區用途；切勿用於高溫電線或機械，以免液化。")
add("Sucrose", "Sucrose", "蔗糖", "solid", ["food", "power"], "Food ingredient and fuel for Sugar Engines; produced through Sweetle and Grubfruit ecology. Balance rocket fuel demand against crop and ranch needs.", "食物原料，也是蔗糖引擎燃料，由甜素甲蟲與蟲果生態鏈取得；需平衡火箭燃料、農作與牧場需求。")
add("Sulfur", "Sulfur", "硫", "solid", ["food", "industrial"], "Fertilizes Grubfruit plants and feeds Sweetles/Grubgrubs, enabling sucrose and food production. Sulfur geysers can make this chain renewable.", "可施肥蟲果並餵甜素甲蟲／蟲果蟲，支援蔗糖與食物生產；硫泉可使此鏈再生。")
add("ToxicMud", "Polluted Mud", "汙泥漿", "solid", ["liquid", "food", "industrial"], "Press into polluted water and polluted dirt, both useful but germ- and off-gassing-prone. Enclose the processing and route outputs deliberately.", "可壓榨成汙水與汙土，兩者皆有用途但容易帶菌及逸氣；加工區應封閉並明確分流產物。")
add("ToxicSand", "Polluted Dirt", "汙土", "solid", ["food", "industrial", "oxygen"], "Compost into dirt or feed Pokeshell-family critters; otherwise it off-gasses polluted oxygen. Store submerged or at sufficient gas pressure.", "可堆肥成泥土，或餵拋殼蟹系生物；否則會逸散汙氧。宜浸液或存於足夠氣壓下。")
add("Unobtanium", "Neutronium", "零號元素", "solid", [], "An effectively indestructible world boundary beneath geysers and map edges. It has no normal player production use and should be treated as terrain, not a harvest target.", "幾乎不可破壞，構成間歇泉底部與地圖邊界；正常遊戲沒有生產用途，應視為地形而非採集目標。")
add("UraniumOre", "Uranium Ore", "鈾礦", "solid", ["power", "radiation", "industrial"], "Enrich for Research Reactor fuel and radbolt production; Beetas can improve the refinement chain. Radiation, nuclear waste and reactor heat require shielding and automation.", "可濃縮成研究反應爐燃料並產生輻射粒子；輻射蜂可改善精煉鏈。輻射、核廢料與反應爐熱需屏蔽及自動化。")
add("Water", "Water", "水", "liquid", ["oxygen", "food", "liquid", "power"], "Electrolyze into oxygen and hydrogen, irrigate crops, research and cool machinery. It is central to many loops, so distinguish renewable supply from one-time deposits.", "可電解成氧氣與氫氣，也供灌溉、研究及冷卻。水牽涉多條核心循環，應區分可再生供應與一次性礦床。")
add("Wolframite", "Wolframite", "鎢錳鐵礦", "solid", ["lateGame", "industrial"], "Refine into tungsten for high-temperature builds and Thermium production. It is scarce, so avoid ordinary construction uses.", "可精煉成鎢，用於高溫建築與導熱質生產；資源稀少，不宜用於一般建築。")
add("ZincOre", "Zinc Ore", "鋅礦", "solid", ["industrial"], "Aquatic metal ore for zinc production and related specialized machinery. Preserve it until the exact refined-metal demand of the colony is known.", "水族包的含鋅礦石，可生產鋅及相關特殊機械；在殖民地精煉金屬需求確定前宜保留。")

# Flora and seeds. Seed entries intentionally explain both planting value and the parent crop.
add("BasicFabricPlant", "Thimble Reed", "頂針蘆葦", "plant", ["industrial"], "Consumes polluted water and produces Reed Fiber for Atmo Suits, clothing and Insulation recipes. Farms are resource-hungry; wild plants are valuable.", "消耗汙水並產出蘆葦纖維，可製氣壓服、衣物與隔熱配方。人工種植耗水高，野生植株很有價值。")
alias("BasicFabricMaterialPlantSeed", "BasicFabricPlant", "Thimble Reed Seed", "頂針蘆葦種子")
add("BasicSingleHarvestPlant", "Mealwood", "米虱木", "plant", ["food"], "An easy early crop that consumes dirt and yields Meal Lice. It needs duplicant labor and has poor food quality; transition before dirt becomes a bottleneck.", "容易栽種的早期作物，消耗泥土並產出米虱；需要複製人勞動且食物品質低，泥土成為瓶頸前應轉型。")
alias("BasicSingleHarvestPlantSeed", "BasicSingleHarvestPlant", "Mealwood Seed", "米虱木種子")
add("BeanPlant", "Nosh Sprout", "小吃芽", "plant", ["food"], "A cold crop irrigated with ethanol that produces Nosh Beans for cooking. It is powerful when ethanol and cooling are already sustainable.", "低溫作物，以乙醇灌溉並產出小吃豆供烹飪；在乙醇與冷卻已可持續時才特別划算。")
alias("BeanPlantSeed", "BeanPlant", "Nosh Bean", "小吃豆")
alias("BeanPlantSeedSparse", "BeanPlant", "Nosh Bean (sparse spawn)", "小吃豆（稀疏生成）")
add("BulbPlant", "Buddy Bud", "同心芽", "plant", ["decoration"], "A decorative plant whose floral scent can suppress other airborne germs, but the scent itself is a germ and may trigger allergies.", "裝飾植物，其花香可排擠其他空氣病菌，但花香本身也是病菌，可能引發過敏。")
alias("BulbPlantSeed", "BulbPlant", "Buddy Bud Seed", "同心芽種子")
add("ColdBreather", "Wheezewort", "冰樹", "plant", ["radiation", "industrial"], "Consumes phosphorite, cools nearby gas and emits radiation in Spaced Out. Use it for spot cooling or radbolts, but provide fertilizer and radiation protection.", "消耗磷礦、冷卻周圍氣體，並在太空包中放出輻射；可作局部降溫或輻射粒子源，但需供肥及防護。")
alias("ColdBreatherSparse", "ColdBreather", "Wheezewort (sparse spawn)", "冰樹（稀疏生成）")
add("ColdWheat", "Sleet Wheat", "雪地小麥", "plant", ["food"], "A cold food crop consuming water and dirt; its grain supports high-quality recipes. Cooling and irrigation are the main engineering costs.", "寒冷食用作物，消耗水與泥土；穀粒可製高品質料理。冷卻與灌溉是主要工程成本。")
alias("ColdWheatSeed", "ColdWheat", "Sleet Wheat Grain", "雪麥穀粒")
add("CritterTrapPlant", "Saturn Critter Trap", "捕獸草", "plant", ["power", "industrial", "hazard"], "Consumes small critters and produces hydrogen after digestion. It can power a niche renewable loop, but feeding and safe ranch integration are complex.", "捕食小型生物並在消化後產氫；可形成特殊再生能源鏈，但供餌與安全牧場整合較複雜。")
alias("CritterTrapPlantSeed", "CritterTrapPlant", "Saturn Critter Trap Seed", "捕獸草種子")
add("ForestForagePlantPlanted", "Hexalent", "蜂巢仙人掌", "plant", ["food"], "A one-harvest forage plant containing emergency calories. It cannot support a renewable farm, so treat it as an exploration reserve.", "一次收穫的覓食植物，提供緊急熱量；不能形成可再生農場，應視為探索備糧。")
add("ForestTree", "Arbor Tree", "喬木樹", "plant", ["power", "industrial"], "Consumes polluted water and dirt to grow lumber branches. Lumber becomes ethanol, power, polluted water and carbon dioxide, enabling a renewable industrial loop.", "消耗汙水與泥土長出木材；木材可轉為乙醇、電力、汙水與二氧化碳，形成可再生工業循環。")
add("LeafyPlant", "Mirth Leaf", "合歡葉", "plant", ["decoration"], "A low-maintenance decorative plant for decor and room bonuses. It does not generate food, oxygen, power or radiation.", "低維護裝飾植物，可提升裝飾與房間效果；不生產食物、氧氣、電力或輻射。")
alias("LeafyPlantSeed", "LeafyPlant", "Mirth Leaf Seed", "合歡葉種子")
add("MushroomPlant", "Dusk Cap", "黃昏蘑菇", "plant", ["food"], "Consumes slime in a carbon-dioxide atmosphere and yields mushrooms. It turns risky slime into good food, but farms need germ-safe slime handling.", "在二氧化碳中消耗軟泥並產出蘑菇，可把高風險軟泥轉成優良食物，但農場需要安全的病菌處理。")
alias("MushroomSeed", "MushroomPlant", "Dusk Cap Spore", "黃昏蘑菇孢子")
add("Oxyfern", "Oxyfern", "氧氣蕨", "plant", ["oxygen"], "Consumes dirt, water and carbon dioxide to emit oxygen. It is useful early but scales poorly because fixed planting spots and fertilizer demand constrain output.", "消耗泥土、水與二氧化碳並放出氧氣；早期有用，但固定種植點與肥料需求使其難以大量擴充。")
alias("OxyfernSeed", "Oxyfern", "Oxyfern Seed", "氧氣蕨種子")
add("PrickleFlower", "Bristle Blossom", "鬃花", "plant", ["food"], "Consumes water and light to produce Bristle Berries for several quality foods. Lighting adds power and heat, so combine it with efficient lamps and cooling.", "消耗水與光照產出鬃刺莓，可製多種優質料理；照明增加耗電與熱，宜搭配高效率燈具及冷卻。")
alias("PrickleFlowerSeed", "PrickleFlower", "Bristle Blossom Seed", "鬃花種子")
add("PrickleGrass", "Bluff Briar", "魅惑棘", "plant", ["decoration"], "A hardy decorative plant for decor and room bonuses. It has no production output but is easy to maintain within its temperature and pressure range.", "耐受性高的裝飾植物，可提升裝飾與房間效果；沒有生產產物，但在適合溫壓範圍內容易維護。")
alias("PrickleGrassSeed", "PrickleGrass", "Bluff Briar Seed", "魅惑棘種子")
add("SaltPlant", "Dasha Saltvine", "沙鹽藤", "plant", ["industrial"], "Consumes chlorine gas and produces salt. It can reclaim chlorine and support rust oxygen or table-salt chains, but needs the correct gas atmosphere.", "消耗氯氣並產出鹽，可回收氯並支援鐵鏽製氧或食鹽鏈，但需要正確的氣體環境。")
alias("SaltPlantSeed", "SaltPlant", "Dasha Saltvine Seed", "沙鹽藤種子")
alias("SaltPlantSeedSparse", "SaltPlant", "Dasha Saltvine Seed (sparse spawn)", "沙鹽藤種子（稀疏生成）")
add("SeaLettuce", "Waterweed", "水草", "plant", ["food"], "An underwater crop fertilized with bleach stone that yields lettuce for high-quality food. Bleach-stone supply and liquid conditions are the main constraints.", "水下作物，以漂白石施肥並產出生菜供高品質料理；漂白石供應與液體環境是主要限制。")
alias("SeaLettuceSeed", "SeaLettuce", "Waterweed Seed", "水草種子")
add("SpiceVine", "Pincha Pepperplant", "火椒藤", "plant", ["food"], "Consumes polluted water and phosphorite in a warm environment to grow Pincha Peppernuts for advanced recipes. Heat is helpful here but irrigation must remain stable.", "在溫暖環境中消耗汙水與磷礦，產出火椒果供進階料理；高溫在此有利，但灌溉必須穩定。")
alias("SpiceVineSeed", "SpiceVine", "Pincha Peppernut", "火椒果")
alias("SpiceVineSeedSparse", "SpiceVine", "Pincha Peppernut (sparse spawn)", "火椒果（稀疏生成）")
add("SwampForagePlant", "Swamp Chard", "沼澤甜菜", "plant", ["food"], "A one-time buried forage food for early survival in swamp regions. Harvested specimens do not form a scalable crop.", "沼澤地區的一次性埋藏覓食糧，適合早期求生；採集後不能形成可擴充農作。")
alias("SwampForagePlantPlanted", "SwampForagePlant", "Swamp Chard Plant", "沼澤甜菜植株")
add("SwampHarvestPlant", "Bog Bucket", "沼澤豬籠草", "plant", ["food"], "Consumes polluted water to produce Bog Jellies in a warm swamp climate. It is a practical early crop where clean water and cooling are scarce.", "在溫暖沼澤氣候中消耗汙水並產出沼澤果凍；缺乏淨水與冷卻時是實用的早期作物。")
alias("SwampHarvestPlantSeed", "SwampHarvestPlant", "Bog Bucket Seed", "沼澤豬籠草種子")
add("SwampLily", "Balm Lily", "香水百合", "plant", ["industrial", "decoration"], "Grows without fertilizer in chlorine and produces Balm Lily Flowers for medical packs. Its chlorine atmosphere is the main setup requirement.", "在氯氣中生長且不需肥料，產出香水百合花供醫療包；主要建置要求是氯氣環境。")
add("ToePlant", "Tranquil Toes", "安寧芷", "plant", ["decoration"], "A decorative plant with no production chain. Use it for decor and room bonuses rather than food, oxygen or power planning.", "沒有生產鏈的裝飾植物，適合提升裝飾與房間效果，不應納入食物、製氧或發電規劃。")
alias("ToePlantSeed", "ToePlant", "Tranquil Toes Seed", "安寧芷種子")
add("WineCups", "Mellow Mallow", "錦醇菇", "plant", ["decoration"], "A decorative plant that improves morale through decor but has no harvestable production output.", "可藉裝飾改善士氣，但沒有可收穫的生產產物。")
alias("WineCupsSeed", "WineCups", "Mellow Mallow Seed", "錦醇菇種子")

# Fauna.
add("Crab", "Pokeshell", "拋殼蟹", "critter", ["industrial", "food", "hazard"], "Eats polluted dirt and rot piles, producing sand; molts provide shells for lime. Adults guarding eggs can attack duplicants, so isolate ranch traffic.", "食用汙土與腐爛堆並產沙；蛻殼可提供製石灰的殼。成體護卵時會攻擊複製人，牧場動線需隔離。")
add("Drecko", "Drecko", "龍鱗蜥", "critter", ["industrial", "food"], "Grazes suitable plants, produces phosphorite and can be sheared for Reed Fiber; Glossy morphs yield plastic. Hydrogen regrows scales, while plants require their own gas and temperature zones.", "啃食適合植物並產磷礦，可剪取蘆葦纖維；滑鱗變種可產塑膠。鱗片需氫氣再生，而植物另有氣體與溫度需求。")
add("Glom", "Morb", "莫布", "critter", ["oxygen", "hazard"], "Produces polluted oxygen when exposed to unsanitary waste conditions. It is an emergency oxygen source, not a clean system, because germs and low output complicate scaling.", "在不衛生的廢物環境中產生汙氧；可作緊急氧源，但病菌與低產量使其不適合當乾淨的大型系統。")
add("LightBug", "Shine Bug", "發光蟲", "critter", ["radiation", "food", "decoration"], "Provides light, decor and radiation; eggs and morphs enable radbolt or solar experiments. It needs food and population control to avoid pathfinding and performance costs.", "提供光照、裝飾與輻射；蛋與變種可支援輻射粒子或太陽能實驗。需供食並控制數量，避免尋路與效能負擔。")
add("Pacu", "Pacu", "帕庫", "critter", ["food"], "Aquatic ranch animal that eats algae or seeds and produces eggs, fillets and polluted dirt. Its cramped reproduction mechanics can provide low-labor food after a breeding pool is established.", "水生牧場動物，食用藻類或種子並產蛋、魚肉與汙土；建立繁殖池後可利用擁擠繁殖機制提供低勞力食物。")
add("Puft", "Puft", "帕夫", "critter", ["industrial", "oxygen"], "Consumes polluted oxygen and excretes slime, renewing algae and mushroom resources. Morph control depends on ranch gases and Puft Prince population.", "食用汙氧並排出軟泥，可再生藻類與蘑菇資源；變種控制取決於牧場氣體及帕夫王數量。")
add("PuftBleachstone", "Squeaky Puft", "氯氣帕夫", "critter", ["industrial", "food"], "Consumes chlorine and excretes bleach stone for Waterweed and sanitation chains. Stable chlorine supply and morph management are required.", "食用氯氣並排出漂白石，支援水草與消毒鏈；需要穩定氯源及變種管理。")
add("Squirrel", "Pip", "樹鼠", "critter", ["food", "industrial"], "Plants seeds in natural tiles for wild farms and converts arbor branches into dirt. Pip planting rules are spatially strict, so prepare tiles and planting order carefully.", "可在天然磚種下種子建立野生農場，也能把喬木枝轉成泥土。樹鼠種植有嚴格空間規則，需仔細安排磚位與種植順序。")
add("Staterpillar", "Plug Slug", "電氣蛞蝓", "critter", ["power", "industrial"], "Consumes refined or raw metal and generates power while sleeping; morphs can provide other gases. Metal cost is high, and exposed conductors must be integrated safely.", "食用精煉或原礦金屬，睡眠時發電；變種可提供其他氣體。金屬成本高，外露導體需安全整合。")


def add_source_backed_entity_profiles() -> None:
    profiles = json.loads(ENTITY_PROFILES.read_text(encoding="utf-8"))["profiles"]
    for profile in profiles:
        prefab_id = profile["prefab_id"]
        if prefab_id in entries:
            continue
        add(
            prefab_id,
            profile["name_en"],
            profile["name_zh"],
            "critter" if profile["kind"] == "fauna" else "plant",
            [
                "decoration" if role == "decor" else role
                for role in profile.get("roles", [])
            ],
            profile["summary_en"],
            profile["summary_zh"],
        )


def add_source_discovered_worldgen_entries() -> None:
    add("BasicForagePlant", "Buried Muckroot", "埋住的塊根", "plant", ["food"], "A one-time buried food source placed by worldgen features. It helps during early exploration but cannot be replanted as a renewable crop.", "由世界生成特徵放置的一次性埋藏食物，可協助早期探索，但不能重新種植成可再生農作。")
    add("GardenForagePlant", "Snactus", "食仙掌", "plant", ["food"], "A worldgen forage plant that provides one-time food in Garden regions. Treat it as exploration supply rather than a scalable farm.", "花園區域的世界生成覓食植物，可提供一次性食物；應視為探索補給而非可擴充農場。")
    add("IceCavesForagePlant", "Sherberry Plant", "雪漿果藤", "plant", ["food"], "A cold-biome forage plant placed by worldgen features. Harvest it for early food, but do not count it as a renewable production chain.", "由世界生成特徵放置的寒冷生態覓食植物，可供早期採集，但不能視為可再生生產鏈。")
    add("LiquidCarbonDioxide", "Liquid Carbon Dioxide", "液態二氧化碳", "liquid", ["industrial", "hazard"], "Very cold liquid carbon dioxide from special worldgen pockets. Its phase changes and extreme temperature require insulated handling.", "特殊世界生成區塊中的極低溫液態二氧化碳；相變與極端低溫都需要隔熱處理。")
    add("Methane", "Natural Gas", "天然氣", "gas", ["power", "industrial", "hazard"], "Fuel for Natural Gas Generators and an input to industrial gas handling. Ventilation and carbon-dioxide byproducts must be planned.", "天然氣發電機的燃料，也可用於工業氣體鏈；需規劃通風及二氧化碳副產物。")
    add("SourGas", "Sour Gas", "酸氣", "gas", ["power", "industrial", "hazard"], "Hot sour gas can be cooled into methane and sulfur for a high-output power chain, but the required temperatures and pressure control are advanced hazards.", "高溫酸氣可冷卻成天然氣與硫，形成高輸出的發電鏈；但所需溫度與壓力控制具有進階風險。")
    add("OilWell", "Oil Reservoir", "油田", "solid", ["power", "industrial", "hazard"], "An oil reservoir accepts water through an Oil Well to produce crude oil. It is a conditional point resource and releases hot natural gas during pressure relief.", "油田可透過油井注水產出原油；它是條件式點資源，洩壓時會釋放高溫天然氣。")
    add("PinkRock", "Lumen Quartz", "輝亮石英", "solid", ["decoration"], "A naturally occurring luminous object in Cool Pool terrain. It provides light and decor and can be carved for stronger decorative value.", "冷池生態中自然生成的發光物件，可提供光照與裝飾，雕刻後具有更高裝飾價值。")
    alias("FossilBitsSmall", "Fossil", "Small Fossil Fragment", "小型化石碎片")
    alias("FossilBitsLarge", "Fossil", "Large Fossil Fragment", "大型化石碎片")


def main() -> None:
    add_source_backed_entity_profiles()
    add_source_discovered_worldgen_entries()
    invalid = sorted(
        key for key, value in entries.items()
        if not value["use_en"] or not value["use_zh"] or not value["name_en"] or not value["name_zh"]
    )
    if invalid:
        raise SystemExit(f"incomplete catalog entries: {invalid}")
    payload = {
        "schema_version": 1,
        "updated_at": CATALOG_UPDATED_AT,
        "baseline": "ONI U59-740622 / Steam build 24423041",
        "scope": "Every emitted worldgen resource plus source-backed flora/fauna profiles",
        "source_policy": [
            "Names follow installed game strings and Dolphinwing Traditional Chinese terminology.",
            "Curated resources use strategic summaries; additional flora/fauna use current installed-game and wiki.gg-backed bilingual entity profiles.",
            "Worldgen presence remains possible rather than guaranteed unless the terrain record says otherwise.",
        ],
        "entries": dict(sorted(entries.items())),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} complete resource entries to {OUTPUT}")


if __name__ == "__main__":
    main()
