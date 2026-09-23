import ryeImg from "../assets/locations/rye.png";
import richparkImg from "../assets/locations/richpark.png";
import lumpiniImg from "../assets/locations/lumpini.png";
import theRichImg from "../assets/locations/the-rich.png";
import pParkImg from "../assets/locations/p-park.png";

/**
 * Fixed apartment & hotel delivery configurations around Shalphyoke
 */
export const FIXED_APARTMENTS = [
	{
		id: "rye",
		name: "Rye",
		fee: 10,
		buildings: ["Building A", "Building B"],
		image: ryeImg,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=RYE+Huamak+Sa-ngop+Suk+Bangkok",
	},
	{
		id: "richpark",
		name: "Richpark",
		fee: 20,
		buildings: [], // Single building
		image: richparkImg,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=Rich+Park+at+Triple+Station+Bangkok",
	},
	{
		id: "lumpini",
		name: "Lumpini",
		fee: 20,
		buildings: ["Building A", "Building B"],
		image: lumpiniImg,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=Lumpini+Ville+Hua+Mak+Station+Bangkok",
	},
	{
		id: "the_rich",
		name: "The Rich",
		fee: 20,
		buildings: [],
		image: theRichImg,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Rich+Rama+9+Srinakarin+Bangkok",
	},
	{
		id: "blitz",
		name: "Blitz",
		fee: 20,
		buildings: ["Building A", "Building B", "Building C"],
		image: null,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=Blitz+Condo+Rama+9+Hua+Mak+Bangkok",
	},
	{
		id: "p_park",
		name: "P Park",
		fee: 20,
		buildings: [],
		image: pParkImg,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=P+Park+Residence+Suan+Luang+Bangkok",
	},
	{
		id: "zayn_hotel",
		name: "Zayn Hotel",
		fee: 20,
		buildings: [],
		image: null,
		mapUrl: "https://www.google.com/maps/search/?api=1&query=Zayn+Hotel+Bangkok",
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
