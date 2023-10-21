import React, { useState, useEffect } from 'react';
import { Form, Select, Button, message, Input } from 'antd';
import useNeo4j from '../hooks/useNeo4j';
import './styles.scss';

const { Option } = Select;

function AddTriple() {
  const [form] = Form.useForm();
  const { addTripleToNeo4j, fetchAllLocations, fetchAllRelations } = useNeo4j();
  const [locations, setLocations] = useState([]);
  const [relations, setRelations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const locationData = await fetchAllLocations();
      if (locationData) {
        setLocations(locationData);
      }

      const relationData = await fetchAllRelations();
      if (relationData) {
        setRelations(relationData);
      }
    };

    fetchData();
  }, []);

  const onFinish = async (values) => {
    try {
      const response = await addTripleToNeo4j(values.foodName, values.relation, values.locationName, values.image, values.sources);
      if (response.status === 409) {
        message.warning('Relationship already exists in Neo4j');
      } else if (response.status === 200) {
        message.success('Relationship created successfully');
      } else {
        message.error('Failed to create the relationship');
      }
      console.log("Data: ", values)
    } catch (error) {
      console.error('Error adding triple:', error);
      message.error('An error occurred');
    }
  };

  return (
    <div className="add-triple-container">
      <h1 className="add-triple-title">Add a Triple</h1>
      <Form form={form} name="addTriple" onFinish={onFinish}>
        <Form.Item name="foodName" label="Food Name" rules={[{ required: true, message: 'Please enter the food name' }]} className="form-item">
          <Input />
        </Form.Item>
        <Form.Item name="relation" label="Relation" rules={[{ required: true, message: 'Please select the relation' }]}>
          <Select className="select">
            {relations.map((relation) => (
              <Option key={relation} value={relation}>
                {relation}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="locationName" label="Location Name" rules={[{ required: true, message: 'Please select the location name' }]}>
          <Select
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            className="select" 
          >
            {locations.map((location) => (
              <Option key={location} value={location}>
                {location}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="image" label="Image (URL)" rules={[{ type: 'url', message: 'Please enter a valid URL' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="sources" label="Source (URL)" rules={[{ type: 'url', message: 'Please enter a valid URL' }]}>
          <Input />
        </Form.Item>
        <Form.Item className="form-item">
          <Button type="primary" htmlType="submit" className="button">
            Add Triple
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default AddTriple;
