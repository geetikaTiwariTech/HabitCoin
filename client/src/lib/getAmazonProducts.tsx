// src/lib/getAmazonProducts.ts
import axios from "axios";

const API_KEY = "1LdSZ16lxwIjs9kDnQ9qspEzqmhqEa0c";

export async function getAmazonProducts(query: string) {
  const url = `https://ecom.webscrapingapi.com/v1?q=${encodeURIComponent(query)}&type=search&amazon_domain=amazon.in&engine=amazon&api_key=${API_KEY}`;

  const res = await axios.get(url);
  return res.data.search_results.product_results || [];
}
