export interface DiplomaMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: { trait_type: string; value: string }[];
  tokenId: string;
}
