import {
  useCallback, useMemo, useRef, useState,
} from 'react';
import { camelCaseObject } from '@edx/frontend-platform/utils';
import { logError } from '@edx/frontend-platform/logging';
import { sendEnterpriseTrackEvent } from '@edx/frontend-enterprise-utils';
import { debounce } from 'lodash-es';

import EnterpriseDataApiService from '../../../../data/services/EnterpriseDataApiService';
import SubsidyApiService from '../../../../data/services/EnterpriseSubsidyApiService';
import { API_FIELDS_BY_TABLE_COLUMN_ACCESSOR } from '../constants';
import { transformUtilizationTableResults, transformUtilizationTableSubsidyTransactionResults } from '../utils';
import useSubsidyAccessPolicy from './useSubsidyAccessPolicy';
import EVENT_NAMES from '../../../../eventTracking';

const applySortByToOptions = (sortBy, options) => {
  const orderingStrings = sortBy.map(({ id, desc }) => {
    const apiFieldForColumnAccessor = API_FIELDS_BY_TABLE_COLUMN_ACCESSOR[id];
    if (!apiFieldForColumnAccessor) {
      return id;
    }
    if (desc) {
      return `-${apiFieldForColumnAccessor}`;
    }
    return apiFieldForColumnAccessor;
  });
  Object.assign(options, {
    ordering: orderingStrings.join(','),
  });
};

const applyFiltersToOptions = (filters, options, shouldFetchSubsidyTransactions = false) => {
  const courseProductLineSearchQuery = filters?.find(filter => filter.id === 'courseProductLine')?.value;
  const searchQuery = filters?.find(filter => filter.id === 'enrollmentDetails')?.value;

  if (courseProductLineSearchQuery) {
    Object.assign(options, { courseProductLine: courseProductLineSearchQuery });
  }
  if (searchQuery) {
    const searchParams = {};
    searchParams[shouldFetchSubsidyTransactions ? 'search' : 'searchAll'] = searchQuery;
    Object.assign(options, searchParams);
  }
};

const useBudgetRedemptions = (
  enterpriseUUID,
  offerId = null,
  budgetId = null,
  isTopDownAssignmentEnabled = false,
) => {
  const shouldTrackFetchEvents = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetRedemptions, setBudgetRedemptions] = useState({
    itemCount: 0,
    pageCount: 0,
    results: [],
  });
  const { data: subsidyAccessPolicy } = useSubsidyAccessPolicy(budgetId);

  const fetchBudgetRedemptions = useCallback((args) => {
    const fetch = async () => {
      try {
        const shouldFetchSubsidyTransactions = budgetId && isTopDownAssignmentEnabled;
        setIsLoading(true);
        const options = {
          page: args.pageIndex + 1, // `DataTable` uses zero-indexed array
          pageSize: args.pageSize,
        };
        if (!shouldFetchSubsidyTransactions) {
          options.ignoreNullCourseListPrice = true;
        }
        if (budgetId !== null) {
          options[shouldFetchSubsidyTransactions ? 'subsidyAccessPolicyUuid' : 'budgetId'] = budgetId;
        }
        if (offerId !== null) {
          options.offerId = offerId;
        }
        if (args.sortBy?.length > 0) {
          applySortByToOptions(args.sortBy, options);
        }
        if (args.filters?.length > 0) {
          applyFiltersToOptions(args.filters, options, shouldFetchSubsidyTransactions);
        }
        let data;
        let transformedTableResults;
        if (shouldFetchSubsidyTransactions) {
          const response = await SubsidyApiService.fetchCustomerTransactions(
            subsidyAccessPolicy?.subsidyUuid,
            options,
          );
          data = camelCaseObject(response.data);
          transformedTableResults = transformUtilizationTableSubsidyTransactionResults(data.results);
        } else {
          const response = await EnterpriseDataApiService.fetchCourseEnrollments(
            enterpriseUUID,
            options,
          );
          data = camelCaseObject(response.data);
          transformedTableResults = transformUtilizationTableResults(data.results);
        }

        setBudgetRedemptions({
          itemCount: data.count,
          // If the data comes from the subsidy transactions endpoint, the number of pages is calculated
          // TODO: https://2u-internal.atlassian.net/browse/ENT-8106
          pageCount: data.numPages ?? Math.floor(data.count / options.pageSize),
          results: transformedTableResults,
        });
        if (shouldTrackFetchEvents.current) {
          // track event only after original API query to avoid sending event on initial page load. instead,
          // only track event when user performs manual data operation (e.g., pagination, sort, filter) and
          // send all table state as event properties.
          sendEnterpriseTrackEvent(
            enterpriseUUID,
            EVENT_NAMES.LEARNER_CREDIT_MANAGEMENT.BUDGET_DETAILS_SPENT_DATATABLE_SORT_BY_OR_FILTER,
            options,
          );
        } else {
          // set to true to enable tracking events on future API queries
          shouldTrackFetchEvents.current = true;
        }
      } catch (error) {
        logError(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (offerId || budgetId) {
      fetch();
    }
  }, [
    enterpriseUUID,
    offerId,
    budgetId,
    shouldTrackFetchEvents,
    isTopDownAssignmentEnabled,
    subsidyAccessPolicy?.subsidyUuid,
  ]);

  const debouncedFetchBudgetRedemptions = useMemo(
    () => debounce(fetchBudgetRedemptions, 300),
    [fetchBudgetRedemptions],
  );

  return {
    isLoading,
    budgetRedemptions,
    fetchBudgetRedemptions: debouncedFetchBudgetRedemptions,
  };
};

export default useBudgetRedemptions;
