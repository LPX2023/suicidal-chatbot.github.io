export async function getGoogleAPI() {
	if (import.meta.env.SSR) {
	  const { google } = await import('googleapis');
	  return google;
	} else {
	  return null;
	}
  }