import axiosInstance from "../../Authorisation/axiosConfig";

function normalizeUser(raw) {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: raw.name ?? "",
    email: raw.email ?? "",
    role: String(raw.role ?? "").toLowerCase(),
  };
}

function extractList(body) {
  const payload = body?.data !== undefined ? body.data : body;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  return [];
}

export async function fetchDirectoryUsers() {
  const res = await axiosInstance.get("/api/admin/users");
  return extractList(res.data).map(normalizeUser);
}

export async function sendUserPasswordInvite(payload) {
  const { data } = await axiosInstance.post(
    "/api/admin/users/send-password",
    payload
  );
  return data;
}
