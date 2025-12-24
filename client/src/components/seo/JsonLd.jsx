import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

/**
 * JsonLd Component
 * Renders JSON-LD structured data script tags safely
 * 
 * @param {Object} props
 * @param {Object|Object[]} props.data - JSON-LD schema object or array of schemas
 * @param {string} props.id - Optional unique identifier for the script tag
 */
function JsonLd({ data, id }) {
  if (!data) {
    return null;
  }

  // Handle array of schemas
  const schemas = Array.isArray(data) ? data : [data];
  
  // Filter out null/undefined schemas
  const validSchemas = schemas.filter(Boolean);
  
  if (validSchemas.length === 0) {
    return null;
  }

  // Safely serialize the JSON-LD data
  const serializeSchema = (schema) => {
    try {
      return JSON.stringify(schema, null, 0);
    } catch (error) {
      console.error('JsonLd: Failed to serialize schema', error);
      return null;
    }
  };

  return (
    <Helmet>
      {validSchemas.map((schema, index) => {
        const serialized = serializeSchema(schema);
        if (!serialized) return null;
        
        const scriptId = id 
          ? `${id}-${index}` 
          : `jsonld-${schema['@type'] || 'schema'}-${index}`;
        
        return (
          <script
            key={scriptId}
            id={scriptId}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serialized }}
          />
        );
      })}
    </Helmet>
  );
}

JsonLd.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.object)
  ]),
  id: PropTypes.string
};

export default JsonLd;
