import axiosInstance from "../../Authorisation/axiosConfig";

export async function createCompany({ name, country, baseCurrency }) {
  const { data } = await axiosInstance.post("/api/admin/companies", {
    name,
    country,
    baseCurrency,
  });
  return data;
}
