import React from "react";
import Table from 'react-bootstrap/Table'
import TableHeader from './tableheader'
import TableBody from './tablebody'
const Tablehis = ({ columns,sortColumn, onSort, data }) => {

  return (
    <Table striped bordered hover variant="light">
        <TableHeader  columns={columns} sortColumn={sortColumn} onSort={onSort} />
        <TableBody columns={columns} data={data} />
</Table>
  );
};

export default Tablehis;