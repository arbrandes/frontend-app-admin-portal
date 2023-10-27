import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import LearnerCreditAllocationTable from './LearnerCreditAllocationTable';
import { useBudgetId, useOfferRedemptions } from './data';

const BudgetDetailRedemptions = ({ enterpriseUUID }) => {
  const { enterpriseOfferId, subsidyAccessPolicyId } = useBudgetId();
  const {
    isLoading,
    offerRedemptions,
    fetchOfferRedemptions,
  } = useOfferRedemptions(enterpriseUUID, enterpriseOfferId, subsidyAccessPolicyId);

  return (
    <section>
      <h3 className="mb-3">Spent</h3>
      <p className="small mb-4">
        Spent activity is driven by completed enrollments. Enrollment data is automatically updated every 12 hours.
        Come back later to view more recent enrollments.
      </p>
      <LearnerCreditAllocationTable
        isLoading={isLoading}
        tableData={offerRedemptions}
        fetchTableData={fetchOfferRedemptions}
      />
    </section>
  );
};

const mapStateToProps = state => ({
  enterpriseUUID: state.portalConfiguration.enterpriseId,
});

BudgetDetailRedemptions.propTypes = {
  enterpriseUUID: PropTypes.string.isRequired,
};

export default connect(mapStateToProps)(BudgetDetailRedemptions);