import { toast } from 'react-toastify';

class BookingService {
  constructor() {
    this.apperClient = null;
    this.tableName = 'booking_c';
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

  async getAll(userId) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_id_c"}},
          {"field": {"Name": "hotel_name_c"}},
          {"field": {"Name": "hotel_image_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "check_in_c"}},
          {"field": {"Name": "check_out_c"}},
          {"field": {"Name": "guests_c"}},
          {"field": {"Name": "nights_c"}},
          {"field": {"Name": "room_type_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "total_price_c"}},
          {"field": {"Name": "confirmation_number_c"}},
          {"field": {"Name": "guest_details_first_name_c"}},
          {"field": {"Name": "guest_details_last_name_c"}},
          {"field": {"Name": "guest_details_email_c"}},
          {"field": {"Name": "guest_details_phone_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      };

      if (userId) {
        params.where = [{"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [parseInt(userId)]}];
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(booking => this.formatBookingData(booking));
    } catch (error) {
      console.error("Error fetching bookings:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async getById(id) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_id_c"}},
          {"field": {"Name": "hotel_name_c"}},
          {"field": {"Name": "hotel_image_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "check_in_c"}},
          {"field": {"Name": "check_out_c"}},
          {"field": {"Name": "guests_c"}},
          {"field": {"Name": "nights_c"}},
          {"field": {"Name": "room_type_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "total_price_c"}},
          {"field": {"Name": "confirmation_number_c"}},
          {"field": {"Name": "guest_details_first_name_c"}},
          {"field": {"Name": "guest_details_last_name_c"}},
          {"field": {"Name": "guest_details_email_c"}},
          {"field": {"Name": "guest_details_phone_c"}},
          {"field": {"Name": "CreatedOn"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (!response.data) {
        throw new Error("Booking not found");
      }

      return this.formatBookingData(response.data);
    } catch (error) {
      console.error("Error fetching booking:", error?.response?.data?.message || error.message);
      throw new Error("Failed to fetch booking");
    }
  }

  async create(bookingData) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      if (Math.random() < 0.1) {
        throw new Error("Room is no longer available for selected dates");
      }
      
      const confirmationNumber = `STY-${String(Date.now()).slice(-6)}-2024`;
      const createData = this.formatCreateData(bookingData, confirmationNumber);
      
      const params = {
        records: [createData]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => toast.error(`${error.fieldLabel}: ${error}`));
            }
            if (record.message) toast.error(record.message);
          });
          throw new Error("Failed to create booking");
        }
        
        if (successful.length > 0) {
          return this.formatBookingData(successful[0].data);
        }
      }

      throw new Error("No data returned from create");
    } catch (error) {
      console.error("Error creating booking:", error?.response?.data?.message || error.message);
      throw new Error("Failed to create booking");
    }
  }

  async update(id, updates) {
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
          throw new Error("Failed to update booking");
        }
        
        if (successful.length > 0) {
          return this.formatBookingData(successful[0].data);
        }
      }

      throw new Error("No data returned from update");
    } catch (error) {
      console.error("Error updating booking:", error?.response?.data?.message || error.message);
      throw new Error("Failed to update booking");
    }
  }

  async cancel(id) {
    return this.update(id, { status: "cancelled" });
  }

  async delete(id) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = { 
        RecordIds: [parseInt(id)]
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return false;
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success);
        const failed = response.results.filter(r => !r.success);
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed);
          failed.forEach(record => {
            if (record.message) toast.error(record.message);
          });
        }
        return successful.length === 1;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error?.response?.data?.message || error.message);
      return false;
    }
  }

  async getByStatus(status, userId) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_name_c"}},
          {"field": {"Name": "hotel_image_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "check_in_c"}},
          {"field": {"Name": "check_out_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "nights_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        where: [
          {"FieldName": "status_c", "Operator": "EqualTo", "Values": [status]}
        ]
      };

      if (userId) {
        params.where.push({"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [parseInt(userId)]});
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(booking => this.formatBookingData(booking));
    } catch (error) {
      console.error("Error fetching bookings by status:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async getUpcoming(userId) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const today = new Date().toISOString().split('T')[0];
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_name_c"}},
          {"field": {"Name": "hotel_image_c"}},
          {"field": {"Name": "location_c"}},
          {"field": {"Name": "check_in_c"}},
          {"field": {"Name": "check_out_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "nights_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        where: [
          {"FieldName": "check_in_c", "Operator": "GreaterThanOrEqualTo", "Values": [today]},
          {"FieldName": "status_c", "Operator": "NotEqualTo", "Values": ["cancelled"]}
        ]
      };

      if (userId) {
        params.where.push({"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [parseInt(userId)]});
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(booking => this.formatBookingData(booking));
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async getRecent(userId, limit = 5) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_name_c"}},
          {"field": {"Name": "hotel_image_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}],
        pagingInfo: {"limit": limit, "offset": 0}
      };

      if (userId) {
        params.where = [{"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [parseInt(userId)]}];
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(booking => this.formatBookingData(booking));
    } catch (error) {
      console.error("Error fetching recent bookings:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  formatBookingData(data) {
    return {
      Id: data.Id,
      userId: data.user_id_c?.Id || data.user_id_c,
      hotelId: data.hotel_id_c,
      hotelName: data.hotel_name_c || data.Name || 'Hotel',
      hotelImage: data.hotel_image_c || "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop",
      location: data.location_c || '',
      checkIn: data.check_in_c || '',
      checkOut: data.check_out_c || '',
      guests: data.guests_c || 1,
      nights: data.nights_c || 1,
      roomType: data.room_type_c || 'Standard',
      status: data.status_c || 'confirmed',
      totalPrice: data.total_price_c || 0,
      confirmationNumber: data.confirmation_number_c || '',
      guestDetails: {
        firstName: data.guest_details_first_name_c || '',
        lastName: data.guest_details_last_name_c || '',
        email: data.guest_details_email_c || '',
        phone: data.guest_details_phone_c || ''
      },
      createdAt: data.CreatedOn || new Date().toISOString()
    };
  }

  formatCreateData(bookingData, confirmationNumber) {
    const nights = Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24));
    
    return {
      Name: `${bookingData.hotelName} - ${confirmationNumber}`,
      hotel_id_c: parseInt(bookingData.hotelId),
      hotel_name_c: bookingData.hotelName,
      hotel_image_c: bookingData.hotelImage,
      location_c: bookingData.location,
      check_in_c: bookingData.checkIn,
      check_out_c: bookingData.checkOut,
      guests_c: parseInt(bookingData.guests),
      nights_c: nights,
      room_type_c: bookingData.roomType,
      status_c: "confirmed",
      total_price_c: parseFloat(bookingData.totalPrice),
      confirmation_number_c: confirmationNumber,
      guest_details_first_name_c: bookingData.guestDetails?.firstName || '',
      guest_details_last_name_c: bookingData.guestDetails?.lastName || '',
      guest_details_email_c: bookingData.guestDetails?.email || '',
      guest_details_phone_c: bookingData.guestDetails?.phone || ''
    };
  }

  formatUpdateData(updates) {
    const updateData = {};
    
    if (updates.status !== undefined) updateData.status_c = updates.status;
    if (updates.hotelName !== undefined) updateData.hotel_name_c = updates.hotelName;
    if (updates.location !== undefined) updateData.location_c = updates.location;
    if (updates.checkIn !== undefined) updateData.check_in_c = updates.checkIn;
    if (updates.checkOut !== undefined) updateData.check_out_c = updates.checkOut;
    if (updates.guests !== undefined) updateData.guests_c = parseInt(updates.guests);
    if (updates.nights !== undefined) updateData.nights_c = parseInt(updates.nights);
    if (updates.roomType !== undefined) updateData.room_type_c = updates.roomType;
    if (updates.totalPrice !== undefined) updateData.total_price_c = parseFloat(updates.totalPrice);
    
    return updateData;
  }
}

export default new BookingService();