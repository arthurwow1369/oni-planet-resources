# U59 地形生存研究包：待 Arthur 核准

本文件只整理研究結論與需要核准的規則。網站實作、commit、push、部署仍未獲授權。

## 1. 版本狀態

- 本機可重現的遊戲資料：U59-740622，Steam build ID `24423041`。
- 2026-08-02 查到的最新公開 U59：U59-744825，發布於 2026-07-28。
- 精確數值以本機 U59-740622 `Assembly-CSharp.dll` 反編譯結果為主要證據。
- 已檢查至 U59-744825 的公開版本資料；未找到推翻本研究中食物、氧氣、電力、輻射、Aquatic worldgen 或尺寸角色結論的更新。
- 因本機尚未更新到 744825，正式實作前仍應先讓 Steam 更新，再重新反編譯並做數值 diff；不能把「公開查無變動」當成「本機已驗證 744825 執行檔」。

## 2. 完成的研究範圍

### Terrain 層

`strategies.json` 已覆蓋網站使用的 26 個 `zoneType`：

Abyss、Barren、Beach、BoggyMarsh、CarrotQuarry、Forest、FrozenWastes、IceCaves、KelpForest、MagmaCore、Metallic、Moo、Ocean、OilField、PrehistoricGarden、PrehistoricRaptor、PrehistoricWetlands、Radioactive、Reef、Rust、Sandstone、Space、SugarWoods、Swamp、ToxicJungle、Wasteland。

每一類均有：

- terrain 摘要；
- 初期／中期食物；
- 氧氣；
- 電力；
- 輻射；
- native、finite、variant-dependent、imported 等依賴分類；
- 危險與注意事項；
- source IDs。

已清理的重大舊建議：

- Forest/Flox 不再把「Lumber -> Ethanol -> Generator」列為直接發電；改為 Lumber -> Wood Burner。
- Kelp Forest/Prehistoric Wetlands/Swamp/Boggy Marsh 不再把多建築的污水處理、電解、氫氣發電鏈列為直接方案。
- Saturn Critter Trap 不再錯誤要求先有 Hydrogen；它需要的是可捕食 critter，Hydrogen 是副產品。
- Kelpole 的 Nori 明確標為 0 kcal 配方材料，不是獨立主食。
- Sugar Woods 分開列 Spigot Seal -> Ethanol -> Petroleum Generator，以及直接 Lumber -> Wood Burner。

### Entity 與食物層

- 79 個本機 entity profile 已整理。
- 野生採收、一次性 forage、栽培、馴養、狩獵及直接材料 recipe 已分開。
- `Mussel Sprout` 已修正為一次性 `DigOnly` forage，產生 2,800 kcal Mussel Tongue，不能當作會再生的作物。
- `Ovagro` 已修正為每個產果 branch 每 3 cycles 產 1 個 325 kcal Ovagro Fig；沒有地圖證據時不猜整棵樹有多少 branch。
- `Mimika Bud` 原始種子是 0 kcal 配方材料；1,500 kcal 是 Toasted Mimillet，不是植物本身。
- Gum Palm、Tublia、Clampum 分別產 Palm Wood、Polypropylene、Pearl，已從直接食物排除。
- Seakomb 需要先處理成 Phyto Oil 再使用食物機器，超過直接路徑規則，從直接食物排除。
- Berry Sludge 名稱和配方已由本機 localization/config 確認，不再使用模糊的 Fruit Cake/Frost Burger 名稱。

### 氧氣、電力、輻射層

已整理並核對：

- 現成 Oxygen、Polluted Oxygen、Oxylite、Polluted Water/Dirt、Slime 的直接用途；
- Oxyfern、Alveo Vera、Oxy Coral、Blowter、Morb；
- Oxygen Diffuser、Algae Terrarium、Electrolyzer、Rust Deoxidizer、Sublimation Station、Deodorizer；
- Manual、Coal、Wood、Peat、Hydrogen、Natural Gas、Petroleum、Solar、Steam、Plug Slug、Tidal Turbine；
- Hatch、Arbor/Lumb、Saturn Trap、Gassy Moo、Molten Slickster、Spigot Seal 等一台 generator 的直接 fuel route；
- Wheezewort、Shine Bug、space、radioactive tiles、Radiation Lamp、Manual Radbolt Generator、Radbolt Generator；
- Steam Turbine 的 125°C 最低 steam、100°C turbine 上限、850 W cap、2 kg/s 及實務自冷限制；
- Cool Steam Vent 的 110°C 不足以單獨驅動 Steam Turbine；
- Plug Slug 1,600 W 是 tame/full-fed 額定，wild -75% 後約 400 W，還可能受 hunger 降低；
- Tidal Turbine 的 300 W 是 spring 活動期間，不得顯示成永遠固定 300 W。

### World 尺寸與角色層

可重現程式已檢查：

- 94 個有合法 `worldsize` 的 world YAML；
- 51 個 cluster YAML；
- 0 個因缺少尺寸而跳過；
- 角色集合：Start、Warp、General、Unreferenced/Internal；
- 精確 X、Y、area、width band、引用 clusters。

主要結論：

- Start/Warp 是角色，不是尺寸。
- 128×153 是常見 Mini/Moonlet family，但共有 24 個 world 使用，當中有些名字不含 `Mini`。
- Mini Regolith 是 96×96 例外。
- Water Moonlet 是 80×174，證明不能只用 Mini/Regular 二分法。
- 玩家在原版不能獨立選 X/Y；cluster/remix 只會換用另一份固定 world config。
- Starmap 圖示不是比例尺；應顯示權威的 `worldsize.X` 水平格數。
- 目前 `public/data/worlds.json` 也有 94 筆，當中包含 internal/test/special/unreferenced worlds；實作前必須核准顯示資格規則。

## 3. 建議排序規則

### 初期

1. 已存在、可直接呼吸／食用／發電／收集的來源。
2. 一次性 forage 或現成野生產物。
3. 保存原生環境即可重複採收的野生來源。
4. 一台低階 building 的直接轉換。
5. 原生溫度、介質、光照、壓力已適合的栽培／馴養。
6. 需要主動冷卻、加熱、壓力控制或複雜環境者。

### 中期

- 野生週期採收；
- 原生環境中的栽培／馴養；
- geyser/vent/season/tidal 等週期來源；
- 一台 active converter；
- 不要求永久或無限。

不按人力或共享資源預算排名；但保留每周期消耗、疾病、熱、耗竭、淹水、壓力及輻射警告。

## 4. 直接路徑規則

列入主要推薦：

- 原生資源直接使用；
- 原生植物／動物直接產出；
- 原生輸入 -> 一台 active building -> 生存產出；
- phase change、自然 offgassing 及原生生態不算額外 active converter。

排除主要直接推薦、只留進階背景：

- 兩台以上 active converters；
- 需要另一 asteroid 資源才成立卻標為 native；
- 只存在於同一 cluster 其他 asteroid 的資源；
- 只看到 biome 名稱便假設每個 seed 必定生成的 critter/plant/geyser；
- 把 ingredient-only、industrial crop 或 seed 誤當 kcal 食物。

## 5. 來源可靠度

優先順序：

1. 本機 worldgen/entity/building/recipe/tuning 執行檔與 YAML；
2. Klei U59 release/hotfix notes；
3. wiki.gg mechanics pages；
4. Klei/Steam/Reddit 討論，用來找實務陷阱，不覆蓋 executable facts。

最新討論提供的主要實務警告：

- Tidal Turbine 是週期性，不是固定平均 300 W；
- Aquatic oxygen route 受光照、水體、food/feed 及 buffering 限制；
- Cool Steam Vent 不能直接滿足 Steam Turbine；
- Steam power 必須同時檢查 source temperature、average heat、dormancy buffer 和 turbine cooling；
- wild Plug Slug 不能顯示 tame 1,600 W 額定。

完整來源在 `sources.json`；原始 wiki 清理資料在 `entity-wiki-extracts.json`。

## 6. 需要 Arthur 核准的決策

請逐項核准或修改：

1. Polluted Oxygen 作為有效緊急呼吸來源，但顯示疾病／debuff 警告。
2. 採用一台 active converter 的直接路徑上限。
3. 野生來源可同時出現在「初期採收」及「中期保存原生環境」兩區。
4. Wild Plug Slug 顯示約 400 W 基準，不使用 1,600 W tame 額定。
5. Tidal Turbine 顯示 300 W active/cyclic，不宣稱持續輸出。
6. Steam power 只有在熱源與完整先決條件成立時才顯示。
7. Ambient radiation 與 Radbolt production 分開。
8. 世界尺寸顯示 role、X×Y、width band 三個獨立欄位，移除 `Regular = size` 的含義。
9. internal/test/unreferenced worlds 隱藏或移到 advanced section。
10. imported/connected 方法只作「本 terrain 無直接 native route」的 fallback，不參與 native 排名。

## 7. 待核准後才執行

只有 Arthur 明確核准上述研究包後，才開始：

- 設計 production schema；
- 將 26 zoneType 與 94 world/variant 的候選方法映射到網站；
- 補 UI 與 Traditional Chinese 文案；
- 加測試；
- 執行 test/lint/build；
- 再另外取得上 dev／部署授權。

目前沒有因這次研究而修改網站 production source，也沒有 commit、push 或部署。
