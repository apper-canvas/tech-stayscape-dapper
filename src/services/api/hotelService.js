import { toast } from 'react-toastify';

class HotelService {
  constructor() {
    this.apperClient = null;
    this.tableName = 'hotel_c';
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

  async getAll(filters = {}) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "city_c"}},
          {"field": {"Name": "state_c"}},
          {"field": {"Name": "country_c"}},
          {"field": {"Name": "price_per_night_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "review_count_c"}},
          {"field": {"Name": "star_rating_c"}},
          {"field": {"Name": "available_c"}},
          {"field": {"Name": "featured_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "coordinates_lat_c"}},
          {"field": {"Name": "coordinates_lng_c"}}
        ],
        where: [],
        orderBy: this.getOrderBy(filters.sortBy)
      };

      // Apply filters
      if (filters.destination) {
        params.whereGroups = [{
          "operator": "OR",
          "subGroups": [
            {
              "conditions": [
                {"fieldName": "city_c", "operator": "Contains", "values": [filters.destination]},
                {"fieldName": "state_c", "operator": "Contains", "values": [filters.destination]},
                {"fieldName": "name_c", "operator": "Contains", "values": [filters.destination]}
              ],
              "operator": "OR"
            }
          ]
        }];
      }

      if (filters.minPrice || filters.maxPrice) {
        if (filters.minPrice) {
          params.where.push({"FieldName": "price_per_night_c", "Operator": "GreaterThanOrEqualTo", "Values": [filters.minPrice]});
        }
        if (filters.maxPrice) {
          params.where.push({"FieldName": "price_per_night_c", "Operator": "LessThanOrEqualTo", "Values": [filters.maxPrice]});
        }
      }

      if (filters.starRating && filters.starRating.length > 0) {
        params.where.push({"FieldName": "star_rating_c", "Operator": "ExactMatch", "Values": filters.starRating});
      }

      if (filters.rating) {
        params.where.push({"FieldName": "rating_c", "Operator": "GreaterThanOrEqualTo", "Values": [filters.rating]});
      }

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        return [];
      }

      return (response.data || []).map(hotel => this.formatHotelData(hotel));
    } catch (error) {
      console.error("Error fetching hotels:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async getById(id) {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "city_c"}},
          {"field": {"Name": "state_c"}},
          {"field": {"Name": "country_c"}},
          {"field": {"Name": "price_per_night_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "review_count_c"}},
          {"field": {"Name": "star_rating_c"}},
          {"field": {"Name": "available_c"}},
          {"field": {"Name": "featured_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "coordinates_lat_c"}},
          {"field": {"Name": "coordinates_lng_c"}}
        ]
      };

      const response = await this.apperClient.getRecordById(this.tableName, id, params);
      
      if (!response.success) {
        console.error(response.message);
        toast.error(response.message);
        throw new Error(response.message);
      }

      if (!response.data) {
        throw new Error("Hotel not found");
      }

      const hotel = this.formatHotelData(response.data);

      // Get review statistics
      try {
        const reviewService = await import("@/services/api/reviewService.js");
        const reviewStats = await reviewService.default.getHotelStats(parseInt(id));
        
        return { 
          ...hotel, 
          rating: reviewStats.averageRating || hotel.rating,
          reviewCount: reviewStats.totalReviews || hotel.reviewCount || 0,
          reviewStats: reviewStats.ratingDistribution
        };
      } catch (err) {
        return hotel;
      }
    } catch (error) {
      console.error("Error fetching hotel:", error?.response?.data?.message || error.message);
      throw new Error("Failed to fetch hotel");
    }
  }

  async getFeatured() {
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "city_c"}},
          {"field": {"Name": "state_c"}},
          {"field": {"Name": "price_per_night_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "review_count_c"}},
          {"field": {"Name": "star_rating_c"}},
          {"field": {"Name": "available_c"}},
          {"field": {"Name": "featured_c"}},
          {"field": {"Name": "description_c"}}
        ],
        where: [{"FieldName": "featured_c", "Operator": "EqualTo", "Values": [true]}],
        pagingInfo: {"limit": 4, "offset": 0}
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(hotel => this.formatHotelData(hotel));
    } catch (error) {
      console.error("Error fetching featured hotels:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async search(query) {
    if (!query || query.trim() === "") {
      return [];
    }
    
    try {
      if (!this.apperClient) this.initApperClient();
      
      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "address_c"}},
          {"field": {"Name": "city_c"}},
          {"field": {"Name": "state_c"}},
          {"field": {"Name": "price_per_night_c"}},
          {"field": {"Name": "rating_c"}},
          {"field": {"Name": "star_rating_c"}},
          {"field": {"Name": "available_c"}},
          {"field": {"Name": "description_c"}}
        ],
        whereGroups: [{
          "operator": "OR",
          "subGroups": [
            {
              "conditions": [
                {"fieldName": "name_c", "operator": "Contains", "values": [query]},
                {"fieldName": "city_c", "operator": "Contains", "values": [query]},
                {"fieldName": "state_c", "operator": "Contains", "values": [query]},
                {"fieldName": "description_c", "operator": "Contains", "values": [query]}
              ],
              "operator": "OR"
            }
          ]
        }]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return (response.data || []).map(hotel => this.formatHotelData(hotel));
    } catch (error) {
      console.error("Error searching hotels:", error?.response?.data?.message || error.message);
      return [];
    }
  }

  async checkAvailability(hotelId, checkIn, checkOut) {
    try {
      const hotel = await this.getById(hotelId);
      if (!hotel) {
        throw new Error("Hotel not found");
      }
      
      const available = hotel.available && Math.random() > 0.1;
      
      return {
        available,
        hotelId: hotel.Id,
        checkIn,
        checkOut,
        rooms: available ? [
          {
            id: `${hotel.Id}_deluxe`,
            type: "Deluxe Room",
            capacity: 2,
            pricePerNight: hotel.pricePerNight,
            amenities: ["Free WiFi", "Mini Bar", "City View"],
            available: true
          },
          {
            id: `${hotel.Id}_suite`,
            type: "Executive Suite",
            capacity: 4,
            pricePerNight: hotel.pricePerNight * 1.5,
            amenities: ["Free WiFi", "Mini Bar", "Ocean View", "Living Area"],
            available: true
          }
        ] : []
      };
    } catch (error) {
      console.error("Error checking availability:", error?.response?.data?.message || error.message);
      throw new Error("Failed to check availability");
    }
  }

  getOrderBy(sortBy) {
    switch (sortBy) {
      case "price-low":
        return [{"fieldName": "price_per_night_c", "sorttype": "ASC"}];
      case "price-high":
        return [{"fieldName": "price_per_night_c", "sorttype": "DESC"}];
      case "rating":
        return [{"fieldName": "rating_c", "sorttype": "DESC"}];
      case "name":
        return [{"fieldName": "name_c", "sorttype": "ASC"}];
      default:
        return [{"fieldName": "Id", "sorttype": "DESC"}];
    }
  }

  formatHotelData(data) {
    return {
      Id: data.Id,
      name: data.name_c || data.Name || 'Hotel',
      address: data.address_c || '',
      location: {
        city: data.city_c || '',
        state: data.state_c || '',
        country: data.country_c || ''
      },
      pricePerNight: data.price_per_night_c || 0,
      rating: data.rating_c || 0,
      reviewCount: data.review_count_c || 0,
      starRating: data.star_rating_c || 3,
      available: data.available_c || false,
      featured: data.featured_c || false,
      description: data.description_c || '',
      coordinates: {
        lat: data.coordinates_lat_c || 0,
        lng: data.coordinates_lng_c || 0
      },
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1578774204375-4c8b6b5b6f8e?w=800&h=600&fit=crop"
      ],
      amenities: [
        "Free WiFi", "Swimming Pool", "Fitness Center", "Restaurant", 
        "Room Service", "Spa", "Business Center", "Parking"
      ]
    };
  }
}

export default new HotelService();