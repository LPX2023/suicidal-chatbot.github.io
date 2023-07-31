export async function getGoogleAPI() {
	if (import.meta.env.SSR) {
	  const { google } = await import('googleapis');
	  return google;
	} else {
	  // Return null or handle the client-side scenario as needed
	  return null;
	}
  }