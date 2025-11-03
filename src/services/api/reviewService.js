import { toast } from 'react-toastify';

const reviewService = {
  constructor() {
    this.apperClient = null;
    this.tableName = 'review_c';
    this.initApperClient();
  },

  initApperClient() {
    if (typeof window !== 'undefined' && window.ApperSDK) {
      const { ApperClient } = window.ApperSDK;
      this.apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      });
    }
  },

  async getAll(filters = {}) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_id_c"}},
          {"field": {"Name": "user_id_c"}},
          {"field": {"Name": "user_name_c"}},
          {"field": {"Name": "user_avatar_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "comment_c"}},
          {"field": {"Name": "photos_c"}},
          {"field": {"Name": "stay_date_c"}},
          {"field": {"Name": "helpful_c"}},
          {"field": {"Name": "verified_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ],
        where: [],
        orderBy: this.getOrderBy(filters.sortBy)
      };

      // Apply filters
      if (filters.hotelId) {
        params.where.push({"FieldName": "hotel_id_c", "Operator": "EqualTo", "Values": [parseInt(filters.hotelId)]});
      }

      if (filters.userId) {
        params.where.push({"FieldName": "user_id_c", "Operator": "EqualTo", "Values": [parseInt(filters.userId)]});
      }

      if (filters.minRating) {
        params.where.push({"FieldName": "rating_c", "Operator": "GreaterThanOrEqualTo", "Values": [filters.minRating]});
      }

      if (filters.search) {
        params.whereGroups = [{
          "operator": "OR",
          "subGroups": [
            {
              "conditions": [
                {"fieldName": "title_c", "operator": "Contains", "values": [filters.search]},
                {"fieldName": "comment_c", "operator": "Contains", "values": [filters.search]},
                {"fieldName": "user_name_c", "operator": "Contains", "values": [filters.search]}
              ],
              "operator": "OR"
            }
          ]
        }];
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(review => this.formatReviewData(review));
    } catch (error) {
      console.error("Error fetching reviews:", error?.response?.data?.message || error.message);
      return [];
    }
  },

  async getById(id) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "hotel_id_c"}},
          {"field": {"Name": "user_id_c"}},
          {"field": {"Name": "user_name_c"}},
          {"field": {"Name": "user_avatar_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "comment_c"}},
          {"field": {"Name": "photos_c"}},
          {"field": {"Name": "stay_date_c"}},
          {"field": {"Name": "helpful_c"}},
          {"field": {"Name": "verified_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "ModifiedOn"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (!response.data) {
        throw new Error("Review not found");
      }

      return this.formatReviewData(response.data);
    } catch (error) {
      console.error("Error fetching review:", error?.response?.data?.message || error.message);
      throw new Error("Failed to fetch review");
    }
  },

  async getByHotelId(hotelId) {
    return this.getAll({ hotelId: parseInt(hotelId) });
  },

  async getByUserId(userId) {
    return this.getAll({ userId: parseInt(userId) });
  },

  async create(reviewData) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      if (!reviewData.hotel_id_c || !reviewData.user_id_c || !reviewData.rating_c || !reviewData.title_c) {
        throw new Error("Missing required fields");
      }

      const createData = this.formatCreateData(reviewData);
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
          throw new Error("Failed to create review");
        }
        
        if (successful.length > 0) {
          return this.formatReviewData(successful[0].data);
        }
      }

      throw new Error("No data returned from create");
    } catch (error) {
      console.error("Error creating review:", error?.response?.data?.message || error.message);
      throw new Error("Failed to create review");
    }
  },

  async update(id, updateData) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const updateFields = this.formatUpdateData(updateData);
      const params = {
        records: [{
          Id: parseInt(id),
          ...updateFields
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
          throw new Error("Failed to update review");
        }
        
        if (successful.length > 0) {
          return this.formatReviewData(successful[0].data);
        }
      }

      throw new Error("No data returned from update");
    } catch (error) {
      console.error("Error updating review:", error?.response?.data?.message || error.message);
      throw new Error("Failed to update review");
    }
  },

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
        return { success: false };
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
        return { success: successful.length === 1 };
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting review:", error?.response?.data?.message || error.message);
      return { success: false };
    }
  },

  async getHotelStats(hotelId) {
    try {
      const hotelReviews = await this.getByHotelId(parseInt(hotelId));
      
      if (hotelReviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }
      
      const totalRating = hotelReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / hotelReviews.length;
      
      const ratingDistribution = hotelReviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1;
        return dist;
      }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      
      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: hotelReviews.length,
        ratingDistribution
      };
    } catch (error) {
      console.error("Error calculating hotel stats:", error?.response?.data?.message || error.message);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
  },

  getOrderBy(sortBy) {
    switch (sortBy) {
      case "newest":
        return [{"fieldName": "CreatedOn", "sorttype": "DESC"}];
      case "oldest":
        return [{"fieldName": "CreatedOn", "sorttype": "ASC"}];
      case "rating-high":
        return [{"fieldName": "rating_c", "sorttype": "DESC"}];
      case "rating-low":
        return [{"fieldName": "rating_c", "sorttype": "ASC"}];
      default:
        return [{"fieldName": "CreatedOn", "sorttype": "DESC"}];
    }
  },

  formatReviewData(data) {
    let photos = [];
    try {
      photos = data.photos_c ? JSON.parse(data.photos_c) : [];
    } catch {
      photos = data.photos_c ? data.photos_c.split(',') : [];
    }

    return {
      Id: data.Id,
      hotelId: data.hotel_id_c,
      userId: data.user_id_c?.Id || data.user_id_c,
      userName: data.user_name_c || "Anonymous",
      userAvatar: data.user_avatar_c || null,
      rating: data.rating_c || 0,
      title: data.title_c || '',
      comment: data.comment_c || '',
      photos: photos,
      stayDate: data.stay_date_c || new Date().toISOString().split('T')[0],
      helpful: data.helpful_c || 0,
      verified: data.verified_c || false,
      createdAt: data.CreatedOn || new Date().toISOString(),
      updatedAt: data.ModifiedOn || new Date().toISOString()
    };
  },

  formatCreateData(reviewData) {
    return {
      Name: `${reviewData.title_c} - Review`,
      hotel_id_c: parseInt(reviewData.hotel_id_c),
      user_id_c: parseInt(reviewData.user_id_c),
      user_name_c: reviewData.user_name_c || "Anonymous",
      user_avatar_c: reviewData.user_avatar_c || null,
      rating_c: parseInt(reviewData.rating_c),
      title_c: reviewData.title_c,
      comment_c: reviewData.comment_c || "",
      photos_c: reviewData.photos_c ? JSON.stringify(reviewData.photos_c) : "[]",
      stay_date_c: reviewData.stay_date_c || new Date().toISOString().split('T')[0],
      helpful_c: 0,
      verified_c: true
    };
  },

  formatUpdateData(updates) {
    const updateData = {};
    
    if (updates.rating !== undefined) updateData.rating_c = parseInt(updates.rating);
    if (updates.title !== undefined) updateData.title_c = updates.title;
    if (updates.comment !== undefined) updateData.comment_c = updates.comment;
    if (updates.photos !== undefined) updateData.photos_c = JSON.stringify(updates.photos);
    if (updates.stayDate !== undefined) updateData.stay_date_c = updates.stayDate;
    if (updates.helpful !== undefined) updateData.helpful_c = parseInt(updates.helpful);
    if (updates.verified !== undefined) updateData.verified_c = updates.verified;
    
    return updateData;
  }
};

// Initialize on import
reviewService.constructor();

export default reviewService;