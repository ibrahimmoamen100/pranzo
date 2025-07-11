// Utility functions for authentication management using cookies

// Set a cookie with expiration
export const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

// Get a cookie value
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// Delete a cookie
export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Check if user is authenticated as admin
export const isAdminAuthenticated = (): boolean => {
  const adminToken = getCookie('adminToken');
  return adminToken === 'true';
};

// Set admin authentication
export const setAdminAuth = () => {
  setCookie('adminToken', 'true', 1); // 1 day
  localStorage.setItem("isAdmin", "true"); // Keep for backward compatibility
};

// Clear admin authentication
export const clearAdminAuth = () => {
  deleteCookie('adminToken');
  localStorage.removeItem("isAdmin");
}; 