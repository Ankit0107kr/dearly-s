// India Post lookup: pincode -> city + state. Public and key-less, but a
// third party, so every failure degrades to the user typing the fields.
const ENDPOINT = "https://api.postalpincode.in/pincode";

export type PincodeResult = {
  city: string;
  state: string;
  district: string;
  areas: string[];
};

type PostOffice = {
  Name: string;
  District: string;
  State: string;
  Block?: string;
};

type Response = {
  Status: "Success" | "Error";
  Message?: string;
  PostOffice?: PostOffice[] | null;
};

export async function lookupPincode(
  pincode: string,
  signal?: AbortSignal,
): Promise<PincodeResult | null> {
  const res = await fetch(`${ENDPOINT}/${pincode}`, { signal });
  if (!res.ok) throw new Error("Could not reach the pincode service");

  const payload = (await res.json()) as Response[];
  const first = payload?.[0];
  if (!first || first.Status !== "Success" || !first.PostOffice?.length) return null;

  const offices = first.PostOffice;
  return {
    city: offices[0].District,
    state: offices[0].State,
    district: offices[0].District,
    areas: [...new Set(offices.map((o) => o.Name))],
  };
}
