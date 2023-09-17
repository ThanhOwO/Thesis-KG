import React from 'react';
import { Table } from 'antd';

const Neo4jTable = ({ neo4jData }) => {
  const subject = JSON.parse(neo4jData.subject);
  const object = JSON.parse(neo4jData.object);

  const columns = [
    {
      title: 'Subject Type',
      dataIndex: 'subjectType',
      key: 'subjectType',
      render: () => subject.type,
    },
    {
      title: 'Subject Name',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: () => subject.name,
    },
    {
      title: 'Subject Image',
      dataIndex: 'subjectImage',
      key: 'subjectImage',
      render: () => <img src={subject.image} alt="Subject" style={{ maxWidth: '100px' }} />,
    },
    {
      title: 'Subject Sources',
      dataIndex: 'subjectSources',
      key: 'subjectSources',
      render: () => (
        <a href={subject.sources} target="_blank" rel="noopener noreferrer">
          {subject.sources}
        </a>
      ),
    },
    {
      title: 'Object Type',
      dataIndex: 'objectType',
      key: 'objectType',
      render: () => object.type,
    },
    {
      title: 'Object Name',
      dataIndex: 'objectName',
      key: 'objectName',
      render: () => object.name,
    },
    {
      title: 'Object Country',
      dataIndex: 'objectCountry',
      key: 'objectCountry',
      render: () => object.country,
    },
  ];

  const data = [
    {
      key: '1',
      subjectType: subject.type,
      subjectName: subject.name,
      subjectImage: <img src={subject.image} alt="Subject" style={{ maxWidth: '100px' }} />,
      subjectSources: (
        <a href={subject.sources} target="_blank" rel="noopener noreferrer">
          {subject.sources}
        </a>
      ),
      objectType: object.type,
      objectName: object.name,
      objectCountry: object.country,
    },
  ];

  return <Table columns={columns} dataSource={data} />;
};

export default Neo4jTable;
