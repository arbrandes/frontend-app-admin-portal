import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  Spinner,
} from '@openedx/paragon';
import ScatterChart from './ScatterChart';
import LineChart from './LineChart';
import BarChart from './BarChart';
import EmptyChart from './EmptyChart';

const ChartWrapper = ({
  isFetching,
  isError,
  chartType,
  chartProps,
  loadingMessage,
}) => {
  if (isError) {
    return <EmptyChart />;
  }

  const chartMap = {
    ScatterChart: <ScatterChart {...chartProps} />,
    LineChart: <LineChart {...chartProps} />,
    BarChart: <BarChart {...chartProps} />,
  };

  return (
    <div className={classNames('analytics-chart-container', { chartType }, { 'is-fetching': isFetching })}>
      {isFetching && (
        <div className="spinner-centered">
          <Spinner animation="border" screenReaderText={loadingMessage} />
        </div>
      )}
      {chartProps.data && chartMap[chartType]}
    </div>
  );
};

ChartWrapper.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  isError: PropTypes.bool.isRequired,
  chartType: PropTypes.oneOf(['ScatterChart', 'LineChart', 'BarChart']).isRequired,
  chartProps: PropTypes.shape({ data: PropTypes.shape({}) }).isRequired,
  loadingMessage: PropTypes.string.isRequired,
};

export default ChartWrapper;