import React, { useState, useEffect } from 'react';
import { useTable, useBlockLayout } from 'react-table';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import './App.css';

function generateTimeIntervals() {
  const intervals = [];
  let hours = 0;
  let minutes = 0;

  for (let i = 0; i < 96; i++) {
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    intervals.push(time);

    minutes += 15;
    if (minutes === 60) {
      minutes = 0;
      hours += 1;
    }
  }

  return intervals;
}

function ColorPickerCell({
  value: initialValue,
  data: data,
  row: { index },
  column: { id },
  updateMyData,
  habitColors,
  setHabitColors,
}) {
  const onChange = e => {
    const newColor = e.target.value;
    updateMyData(index, id, newColor);

    // Update the habitColors state
    const habitName = data[index].habit;
    setHabitColors({
      ...habitColors,
      [habitName]: newColor,
    });
  };

  return (
    <input 
      type="color"
      value={initialValue} 
      onChange={onChange}
    />
  );
}

function WeeklySchedule({handleCellClick, selectedHabit, schedule, mouseIsDown, setMouseIsDown, habitColors}) {
  const timeIntervals = generateTimeIntervals();
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <table>
      <thead>
        <tr>
          <th></th> {/* Empty header for the time intervals column */}
          {daysOfWeek.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeIntervals.map((time, index) => (
          <tr key={index}>
            <th style={{ userSelect: 'none' }}>{time}</th> {/* Time interval as row header */}
            {daysOfWeek.map((day, i) => (
            <td
              key={i}
              onMouseDown={() => { handleCellClick(index, i); setMouseIsDown(true); }}
              onMouseUp={() => setMouseIsDown(false)}
              onMouseOver={() => mouseIsDown && handleCellClick(index, i)}
              style={{
                border: '1px solid black',
                backgroundColor: habitColors[schedule[i][index]],
              }}
            ></td>
          ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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

  const inputStyle = {
    fontSize: '1em', 
    width: '100%', 
    padding: '10px'
  };

  return (
    <input 
      value={value} 
      onChange={onChange} 
      onBlur={onBlur}       
      onKeyPress={onKeyPress} 
      style={inputStyle}
    />
  );
}

function EditableTable({ data, setData, columns, habitColors, setHabitColors }) {
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

function RechartsPieChart({ data, setSelectedHabit, habitColors, setHabitColors }) {
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
            onClick={(data, index) => setSelectedHabit(data.name)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={habitColors[entry.name]} />
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
    { habit: 'Running', weeklyFrequency: 3, duration: 30, totalTime: 90, color: '#00FF00' },
    { habit: 'Reading', weeklyFrequency: 7, duration: 20, totalTime: 140, color: '#0000FF' },
  ]);

  const [habitColors, setHabitColors] = useState({"Running": "#00FF00", "Reading": "#0000FF"});

  const [chartData, setChartData] = useState([]);

  const timeIntervals = generateTimeIntervals();
  const [selectedHabit, setSelectedHabit] = useState(null);
  const handleCellClick = (row, col) => {
    if (selectedHabit) {
      setSchedule(old => {
        const newSchedule = [...old];
        newSchedule[col][row] = selectedHabit;
        return newSchedule;
      });
    }
  };
  const [schedule, setSchedule] = useState(
    Array(7).fill(0).map(() => Array(timeIntervals.length).fill(null))
  );
  const [mouseIsDown, setMouseIsDown] = useState(false);
  const [includeUnallocated, setIncludeUnallocated] = useState(false);

  useEffect(() => {
    // Transform the table data into the format expected by the pie chart
    const newChartData = data.map(item => ({
      name: item.habit,
      value: item.totalTime,
    }));

    setChartData(newChartData);
  }, [data]);

  useEffect(() => {
    const handleMouseUp = () => setMouseIsDown(false);
    window.addEventListener('mouseup', handleMouseUp);
  
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    // Calculate total time of all habits
    const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);
  
    // Calculate total minutes in a week
    const totalMinutesInWeek = 7 * 24 * 60;
  
    // Calculate unallocated time
    const unallocatedTime = totalMinutesInWeek - totalTime;
  
    // Transform the table data into the format expected by the pie chart
    let newChartData = data.map(item => ({
      name: item.habit,
      value: item.totalTime,
    }));
  
    // Include unallocated time if checkbox is checked
    if (includeUnallocated) {
      newChartData.push({ name: 'Unallocated', value: unallocatedTime });
    }
  
    setChartData(newChartData);
  }, [data, includeUnallocated]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Habit',
        accessor: 'habit',
        Cell: EditableCell,
        minWidth: 200, // minimum width of the column
        width: 400, // preferred width of the column
        maxWidth: 800, // maximum width of the column
      
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
      {
        Header: 'Color',
        accessor: 'color',
        Cell: props => <ColorPickerCell {...props} data={data} habitColors={habitColors} setHabitColors={setHabitColors} />,
      },
    ],
    []
  );

  const addRow = () => {
    setData(old => [
      ...old,
      { habit: '', weeklyFrequency: 0, duration: 0, totalTime: 0 * 0, color: '#000000' },
    ]);
    setHabitColors(old => ({
      ...old,
      '': '#000000',
    }));
  };

  return (
    <div className="App" style={{ display: 'flex' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <div style={{display: 'flex', flexDirection: 'column'}}>
        <EditableTable data={data} setData={setData} columns={columns} habitColors={habitColors} setHabitColors={setHabitColors} />   
          <button onClick={addRow} className='button'>Add Row</button>
        </div>
        <div style={{width: '100%', display: 'flex', flexDirection: 'column'}}>
        <label>
          <input
            type="checkbox"
            checked={includeUnallocated}
            onChange={() => setIncludeUnallocated(!includeUnallocated)}
          />
          Include unallocated time
        </label>
        <label>
          Selected habit: {selectedHabit} 
          {selectedHabit && (
          <div 
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              backgroundColor: habitColors[selectedHabit],
              marginLeft: '10px',
            }}
          />
          )}
        </label>
        <RechartsPieChart data={chartData} setSelectedHabit={setSelectedHabit} habitColors={habitColors} setHabitColors={setHabitColors} />
        <div style={{display: 'flex', overflowY: 'auto', justifyContent: 'center'}} >
        <WeeklySchedule handleCellClick={handleCellClick} selectedHabit={selectedHabit} schedule={schedule} mouseIsDown={mouseIsDown} setMouseIsDown={setMouseIsDown} habitColors={habitColors} />
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;