'use server'
import { UserProfile } from "./type";

/**
 * Get user profile with access token
 */
export async function apiGetProfile(accessToken: string): Promise<UserProfile> {
  try {
    const response = await fetch(`http://localhost:3000/api/profile/${accessToken}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });    
    

    const data = await response.json();

    // Check for error response
    if (data.status !== 200) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}