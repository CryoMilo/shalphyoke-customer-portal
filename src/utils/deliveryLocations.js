/**
 * Fixed apartment delivery configurations around Shalphyoke
 */
export const FIXED_APARTMENTS = [
	{
		id: "richpark",
		name: "Richpark",
		fee: 20,
		buildings: [], // Single building or not specified
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
		id: "rye",
		name: "Rye",
		fee: 10,
		buildings: ["Building A", "Building B"],
	},
];

/**
 * Format full delivery address string
 */
export const formatDeliveryAddress = ({ apartment, building, roomNumber, dropoffNote }) => {
	const aptName = apartment?.name || "";
	const bldg = building ? ` (${building})` : "";
	const room = roomNumber ? ` Room: ${roomNumber}` : "";
	const note = dropoffNote ? ` - Note: ${dropoffNote}` : "";
	return `${aptName}${bldg}${room}${note}`.trim();
};
