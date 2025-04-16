import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { randomBytes } from 'crypto';

export type SearchData = {
    index: string;
    field: string;
    value?: string;
    valueArray?: string[];
    greaterValue?: number;
    lowerValue?: number;
    searchType?: string;
};

@Injectable()
export class ElasticService {
    constructor(private readonly elasticSearchService: ElasticsearchService) {}

    async createIndex(index: string): Promise<any> {
        return await this.elasticSearchService.indices.create({
            index,
        });
    }

    async indexExists(index: string): Promise<any> {
        return await this.elasticSearchService.indices.exists({ index });
    }

    // Add a document to Elasticsearch
    async addData(index: string, id: string, data: any): Promise<any> {
        return await this.elasticSearchService.index({
            index,
            id,
            body: data
        });
    }

    // Get a document by ID
    async getData(index: string, id: string): Promise<any> {
        try {
            const result = await this.elasticSearchService.get({ 
                index, 
                id,
            });
            return result;  
        } catch (err) {
            return null;
        }
        
    }
      
    // Search documents with multiple query types
    async searchData(searchData: SearchData): Promise<any> {
        var { index, field, valueArray, value, greaterValue, lowerValue, searchType } = searchData;
        searchType = (searchType === undefined) ? 'all' : searchType;
        let query;

        switch (searchType) {
            case 'all':
                query = { match_all: {} };
                break;

            case 'terms':
                query = { terms: { [field]: valueArray } };
                break;

            case 'match': // Full-text search (default)
                query = { match: { [field]: value } };
                break;

            case 'term': // Exact match (case-sensitive)
                query = { term: { [field]: value } };
                break;

            case 'wildcard': // Partial match with wildcard (* for multiple, ? for single character)
                query = { wildcard: { [field]: `*${value}*` } };
                break;

            case 'fuzzy': // Fuzzy search (handles typos)
                query = { fuzzy: { [field]: { value, fuzziness: "AUTO" } } };
                break;

            case 'range': // Range search (for numbers, dates)
                query = {
                    range: {
                        [field]: {
                            gte: greaterValue,
                            lte: lowerValue
                        }
                    }
                };
                break;

            case 'prefix': // Prefix match (starts with)
                query = { prefix: { [field]: value } };
                break;

            case 'regexp': // Regular expression match
                query = { regexp: { [field]: value } };
                break;

            default:
                throw new Error(`Invalid searchType: ${searchType}`);
        }

        const result = await this.elasticSearchService.search({
            index,
            body: { query }
        });

        return result.hits.hits.map(hit => hit);
    }

    async fieldExists(index: string, field: string): Promise<any> {
        const query = { bool: { must: { exists: { field } } } };
        const result = await this.elasticSearchService.search({
            index,
            body: { query }
        });

        return result.hits.hits.map(hit => hit._source);
    }

    async bulkInsert(index: string, data: any[]): Promise<any> {
        const body = data.flatMap((doc) => [{ index: { _index: index, _id: doc.id } }, doc]);
        return this.elasticSearchService.bulk({ refresh: true, body });
    }
      
    async bulkDelete(index: string, ids: string[]): Promise<any> {
        const body = ids.flatMap((id) => [{ delete: { _index: index, _id: id } }]);
        return this.elasticSearchService.bulk({ refresh: true, body });
    }

    async updatePartial(index: string, id: string, updateData: any): Promise<any> {
        const result = await this.elasticSearchService.update({
            index,
            id,
            body: { doc: updateData },
        });
        return result;
    }

    async delete(index: string, id: string): Promise<any> {
        return this.elasticSearchService.delete({
            index,
            id,
        })
    }

    async deleteByQuery(index: string, field: string, value: string): Promise<any> {
        return this.elasticSearchService.deleteByQuery({
            index,
            body: { query: { match: { [field]: value } } },
        });
    }
}
