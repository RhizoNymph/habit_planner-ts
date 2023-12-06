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
  row: { index, values },
  column: { id },
  updateMyData,
  data,
  habitColors,
  setHabitColors,
}) {
  const onChange = e => {
    const newColor = e.target.value;
    updateMyData(index, id, newColor);

    // Update the habitColors state    
    const habitName = values.habit;
    if (habitName) {
      setHabitColors({
        ...habitColors,
        [habitName]: newColor,
      });
    }
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
            <th key={index} className="sticky-header">{day}</th>
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
                border: '1px solid #777',
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
  data,
  habitColors,
  setHabitColors,
}) {
  const [value, setValue] = useState(initialValue);

  const onChange = e => {
    const newValue = e.target.value;
    setValue(newValue);
    if (e.id === 'habit') {
      setHabitColors(old => ({
        ...old,
        [newValue]: old[initialValue],
      }));
    }
  }; 

  const onBlur = () => {
    updateMyData(index, id, value);
  };

  const onKeyPress = e => {
    if (e.key === 'Enter') {
      onBlur();
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
        label={({ name, value, percent, payload }) => {
          const type = payload.type ? payload.type.charAt(0).toUpperCase() + payload.type.slice(1) : '';
          return `${type}: ${name} ${value} (${(percent * 100).toFixed(0)}%)`;
        }}
        onClick={(data, index) => setSelectedHabit(data.name)}          
      >
  {data.map((entry, index) => (
    <Cell 
      key={`cell-${index}`} 
      fill={entry.type === 'allocated' ? habitColors[entry.name] : `url(#diagonalHatch-${index})`}
    />
  ))}
</Pie>
<defs>
  {data.map((entry, index) => (
    <pattern id={`diagonalHatch-${index}`} patternUnits="userSpaceOnUse" width="4" height="4">
      <path d="M-1,1 l2,-2
               M0,4 l4,-4
               M3,5 l2,-2" 
            style={{ stroke: habitColors[entry.name], strokeWidth: 1 }}
      />
    </pattern>
  ))}
</defs>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('data')) || [
    { habit: 'Cardio', weeklyFrequency: 5, duration: 20, totalTime: 5*20, color: '#00FF00' },
    { habit: 'Yoga', weeklyFrequency: 3, duration: 20, totalTime: 3*20, color: '#0000FF' },
  ]);
  
  const [habitColors, setHabitColors] = useState(() => JSON.parse(localStorage.getItem('habitColors')) || {"Cardio": "#00FF00", "Yoga": "#0000FF"});

  const [chartData, setChartData] = useState(() => JSON.parse(localStorage.getItem('chartData')) || []);

  const timeIntervals = generateTimeIntervals();
  const [selectedHabit, setSelectedHabit] = useState(() => localStorage.getItem('selectedHabit') || null);
  const handleCellClick = (row, col) => {
    if (selectedHabit) {
      setSchedule(old => {
        const newSchedule = [...old];
        // If the cell already contains the selected habit, set it to null
        // Otherwise, set it to the selected habit
        newSchedule[col][row] = newSchedule[col][row] === selectedHabit ? null : selectedHabit;
        return newSchedule;
      });
    }
  };
  const [schedule, setSchedule] = useState(() => JSON.parse(localStorage.getItem('schedule')) || Array(7).fill(0).map(() => Array(timeIntervals.length).fill(null)));
  const [mouseIsDown, setMouseIsDown] = useState(false);
  const [includeUnallocated, setIncludeUnallocated] = useState(() => JSON.parse(localStorage.getItem('includeUnallocated')) || false);

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
  
    // Calculate the total scheduled time for each habit
    const scheduledTimes = schedule.flat().reduce((acc, habit) => {
      if (habit) {
        acc[habit] = (acc[habit] || 0) + 15;
      }
      return acc;
    }, {});
  
    // Transform the table data into the format expected by the pie chart
    let newChartData = data.flatMap(item => [
      { name: item.habit, value: item.totalTime, type: 'allocated' },
      { name: item.habit, value: scheduledTimes[item.habit] || 0, type: 'scheduled' },
    ]);
  
    // Include unallocated time if checkbox is checked
    if (includeUnallocated) {
      newChartData = [...newChartData, { name: 'Unallocated', value: unallocatedTime, type: 'Unallocated' }];
    } else {
      newChartData = newChartData.filter(item => item.type !== 'Unallocated');
    }
  
    setChartData(newChartData);
  }, [data, schedule, includeUnallocated]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Habit',
        accessor: 'habit',
        Cell: props => <EditableCell {...props} data={data} habitColors={habitColors} setHabitColors={setHabitColors} />,
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
    const placeholder = (data.length + 1).toString();
    setData(old => [
      ...old,
      { habit: placeholder, weeklyFrequency: 1, duration: 15, totalTime: 1 * 15, color: '#000000' },
    ]);
    setHabitColors(old => ({
      ...old,
      placeholder: '#000000',
    }));
  };

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
    localStorage.setItem('habitColors', JSON.stringify(habitColors));
    localStorage.setItem('chartData', JSON.stringify(chartData));
    localStorage.setItem('selectedHabit', selectedHabit);
    localStorage.setItem('schedule', JSON.stringify(schedule));    
    localStorage.setItem('includeUnallocated', JSON.stringify(includeUnallocated));
  }, [data, habitColors, chartData, selectedHabit, schedule, includeUnallocated]); 

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