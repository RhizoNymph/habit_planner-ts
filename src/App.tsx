import React, { useState, useEffect } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import './App.css';

function EditableCell({
  value: initialValue,
  row: { index },
  column: { id },
  updateMyData,
}) {
  const [value, setValue] = useState(initialValue);

  const onChange = e => {
    setValue(e.target.value);
  };

  const onBlur = () => {
    updateMyData(index, id, value);
  };

  const onKeyPress = e => {
    if (e.key === 'Enter') {
      updateMyData(index, id, value);
    }
  };

  return (
    <input 
      value={value} 
      onChange={onChange} 
      onBlur={onBlur}       
      onKeyPress={onKeyPress} 
      style={{ fontSize: '1em', width: '100%', padding: '10px' }} // Add styles here
    />
  );
}

function EditableTable({ data, setData, columns }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data,
      updateMyData: (rowIndex, columnId, value) => {
        setData(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              const updatedRow = {
                ...old[rowIndex],
                [columnId]: value,
              };
              if (columnId === 'duration' || columnId === 'weeklyFrequency') {
                updatedRow.totalTime = updatedRow.duration * updatedRow.weeklyFrequency;
              }
              return updatedRow;
            }
            return row;
          })
        );
      },
    },
    useBlockLayout
  );

  return (
    <table {...getTableProps()} className='table'>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RechartsPieChart({ data }) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={data}
            cx="50%"
            cy="50%"
            outerRadius="50%"
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [data, setData] = useState([
    { habit: 'Running', weeklyFrequency: 3, duration: 30, totalTime: 90 },
    { habit: 'Reading', weeklyFrequency: 7, duration: 20, totalTime: 140 },
  ]);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Transform the table data into the format expected by the pie chart
    const newChartData = data.map(item => ({
      name: item.habit,
      value: item.totalTime,
    }));

    setChartData(newChartData);
  }, [data]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Habit',
        accessor: 'habit',
        Cell: EditableCell,
      },
      {
        Header: 'Weekly Frequency',
        accessor: 'weeklyFrequency',
        Cell: EditableCell,
      },
      {
        Header: 'Duration',
        accessor: 'duration',
        Cell: EditableCell,
      },
      {
        Header: 'Total Time',
        accessor: 'totalTime',
        Cell: ({ value }) => value, // Directly render the value
      },
    ],
    []
  );

  const addRow = () => {
    setData(old => [
      ...old,
      { habit: '', weeklyFrequency: 0, duration: 0, totalTime: 0 * 0 },
    ]);
  };

  return (
    <div className="App" style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <EditableTable data={data} setData={setData} columns={columns} />
        <button onClick={addRow} className='button'>Add Row</button>
      </div>
      <div style={{ width: '50%' }}>
        <RechartsPieChart data={chartData} />
      </div>
    </div>
  );
}

export default App;