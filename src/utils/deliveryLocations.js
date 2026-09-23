/**
 * Fixed apartment & hotel delivery configurations around Shalphyoke
 */
export const FIXED_APARTMENTS = [
	{
		id: "rye",
		name: "Rye",
		fee: 10,
		buildings: ["Building A", "Building B"],
	},
	{
		id: "richpark",
		name: "Richpark",
		fee: 20,
		buildings: [], // Single building
	},
	{
		id: "lumpini",
		name: "Lumpini",
		fee: 20,
		buildings: ["Building A", "Building B"],
	},
	{
		id: "the_rich",
		name: "The Rich",
		fee: 20,
		buildings: [],
	},
	{
		id: "blitz",
		name: "Blitz",
		fee: 20,
		buildings: ["Building A", "Building B", "Building C"],
	},
	{
		id: "p_park",
		name: "P Park",
		fee: 20,
		buildings: [],
	},
	{
		id: "zayn_hotel",
		name: "Zayn Hotel",
		fee: 20,
		buildings: [],
	},
];

/**
 * Format full delivery address string
 */
export const formatDeliveryAddress = ({ apartment, building, dropoffNote }) => {
	const aptName = typeof apartment === "string" ? apartment : apartment?.name || "";
	const bldg = building ? ` (${building})` : "";
	const note = dropoffNote ? ` - Note: ${dropoffNote}` : "";
	return `${aptName}${bldg}${note}`.trim();
};

/**
 * Clean and normalize building_info string
 */
export const formatBuildingInfo = ({ building }) => {
	return building ? building.trim() : "";
};
