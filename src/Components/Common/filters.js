import React from 'react';
import { Input } from 'reactstrap';
import AppSelect from './AppSelect';

export const Filter = ({ column }) => {
  return (
    <div style={{ marginTop: 5 }}>
      {column.canFilter && column.render('Filter')}
    </div>
  );
};

export const DefaultColumnFilter = ({
  column: {
    filterValue,
    setFilter,
    preFilteredRows: { length },
  },
}) => {
  return (
    <Input
      value={filterValue || ''}
      onChange={(e) => {
        setFilter(e.target.value || undefined);
      }}
      placeholder={`search (${length}) ...`}
    />
  );
};

export const SelectColumnFilter = ({
  column: { filterValue, setFilter, preFilteredRows, id },
}) => {
  const options = React.useMemo(() => {
    const optionValues = new Set();
    preFilteredRows.forEach((row) => {
      optionValues.add(row.values[id]);
    });
    return [
      { value: '', label: 'All' },
      ...[...optionValues.values()].map((option) => ({
        value: option,
        label: option,
      })),
    ];
  }, [id, preFilteredRows]);

  return (
    <AppSelect
      inputId="custom-select"
      options={options}
      value={options.find((option) => option.value === filterValue) || options[0]}
      onChange={(option) => {
        setFilter(option?.value || undefined);
      }}
      isSearchable={false}
      placeholder="Filter results"
    />
  );
};
