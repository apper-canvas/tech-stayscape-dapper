import { toast } from 'react-toastify';

class UserService {
  constructor() {
    this.apperClient = null;
    this.tableName = 'user_c';
    this.initApperClient();
  }

  initApperClient() {
    if (typeof window !== 'undefined' && window.ApperSDK) {
      const { ApperClient } = window.ApperSDK;
      this.apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });
    }
  }

  async getById(id) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "first_name_c"}},
          {"field": {"Name": "last_name_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "avatar_c"}},
          {"field": {"Name": "loyalty_status_c"}},
          {"field": {"Name": "member_since_c"}},
          {"field": {"Name": "total_bookings_c"}},
          {"field": {"Name": "room_type_c"}},
          {"field": {"Name": "bed_type_c"}},
          {"field": {"Name": "smoking_preference_c"}},
          {"field": {"Name": "floor_preference_c"}},
          {"field": {"Name": "newsletter_c"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (!response.data) {
        throw new Error("User not found");
      }

      return this.formatUserData(response.data);
    } catch (error) {
      console.error("Error fetching user:", error?.response?.data?.message || error.message);
      throw new Error("Failed to fetch user");
    }
  }

  async getCurrentUser() {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "email_c"}},
          {"field": {"Name": "first_name_c"}},
          {"field": {"Name": "last_name_c"}},
          {"field": {"Name": "phone_c"}},
          {"field": {"Name": "avatar_c"}},
          {"field": {"Name": "loyalty_status_c"}},
          {"field": {"Name": "member_since_c"}},
          {"field": {"Name": "total_bookings_c"}},
          {"field": {"Name": "room_type_c"}},
          {"field": {"Name": "bed_type_c"}},
          {"field": {"Name": "smoking_preference_c"}},
          {"field": {"Name": "floor_preference_c"}},
          {"field": {"Name": "newsletter_c"}}
        ],
        pagingInfo: {"limit": 1, "offset": 0}
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (!response.data || response.data.length === 0) {
        throw new Error("No current user found");
      }

      return this.formatUserData(response.data[0]);
    } catch (error) {
      console.error("Error fetching current user:", error?.response?.data?.message || error.message);
      throw new Error("Failed to fetch current user");
    }
  }

  async updateProfile(id, updates) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const updateData = this.formatUpdateData(updates);
      const params = {
        records: [{
          Id: parseInt(id),
          ...updateData
        }]
      };

      const response = await this.apperClient.updateRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            }
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to update profile");
        }
        
        if (successful.length > 0) {
          return this.formatUserData(successful[0].data);
        }
      }

      throw new Error("No data returned from update");
    } catch (error) {
      console.error("Error updating profile:", error?.response?.data?.message || error.message);
      throw new Error("Failed to update profile");
    }
  }

  formatUserData(data) {
    return {
      Id: data.Id,
      name: `${data.first_name_c || ''} ${data.last_name_c || ''}`.trim() || data.Name || 'User',
      firstName: data.first_name_c || '',
      lastName: data.last_name_c || '',
      email: data.email_c || '',
      phone: data.phone_c || '',
      avatar: data.avatar_c || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      loyaltyStatus: data.loyalty_status_c || 'bronze',
      memberSince: data.member_since_c || new Date().toISOString().split('T')[0],
      totalBookings: data.total_bookings_c || 0,
      preferences: {
        roomType: data.room_type_c || 'deluxe',
        bedType: data.bed_type_c || 'queen', 
        smokingPreference: data.smoking_preference_c || 'non-smoking',
        floorPreference: data.floor_preference_c || 'any',
        newsletter: data.newsletter_c || false
      }
    };
  }

  formatUpdateData(updates) {
    const updateData = {};
    
    if (updates.firstName !== undefined) updateData.first_name_c = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name_c = updates.lastName;
    if (updates.email !== undefined) updateData.email_c = updates.email;
    if (updates.phone !== undefined) updateData.phone_c = updates.phone;
    if (updates.avatar !== undefined) updateData.avatar_c = updates.avatar;
    if (updates.loyaltyStatus !== undefined) updateData.loyalty_status_c = updates.loyaltyStatus;
    if (updates.memberSince !== undefined) updateData.member_since_c = updates.memberSince;
    if (updates.totalBookings !== undefined) updateData.total_bookings_c = updates.totalBookings;
    
    if (updates.preferences) {
      if (updates.preferences.roomType !== undefined) updateData.room_type_c = updates.preferences.roomType;
      if (updates.preferences.bedType !== undefined) updateData.bed_type_c = updates.preferences.bedType;
      if (updates.preferences.smokingPreference !== undefined) updateData.smoking_preference_c = updates.preferences.smokingPreference;
      if (updates.preferences.floorPreference !== undefined) updateData.floor_preference_c = updates.preferences.floorPreference;
      if (updates.preferences.newsletter !== undefined) updateData.newsletter_c = updates.preferences.newsletter;
    }
    
    return updateData;
  }
}

export default new UserService();