import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { camelCaseObject } from '@edx/frontend-platform';
import { renderWithRouter } from '@edx/frontend-enterprise-utils';

import ContentHighlightsCardItemsContainer from '../ContentHighlightsCardItemsContainer';
import { TEST_COURSE_HIGHLIGHTS_DATA } from '../data/constants';

const mockStore = configureMockStore([thunk]);

const testHighlightSet = camelCaseObject(TEST_COURSE_HIGHLIGHTS_DATA)[0]?.highlightedContent;
const initialState = {
  portalConfiguration: {
    enterpriseSlug: 'test-enterprise',
  },
};

const ContentHighlightsCardItemsContainerWrapper = (props) => (
  <Provider store={mockStore(initialState)}>
    <ContentHighlightsCardItemsContainer {...props} />
  </Provider>
);

describe('<ContentHighlightsCardItemsContainer>', () => {
  it('Displays all content data titles', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper />);
    const firstTitle = testHighlightSet[0].title;
    const lastTitle = testHighlightSet[testHighlightSet.length - 1].title;
    expect(screen.getByText(firstTitle)).toBeInTheDocument();
    expect(screen.getByText(lastTitle)).toBeInTheDocument();
  });

  it('Displays all content data content types', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper />);
    const firstContentType = testHighlightSet[0].contentType;
    const lastContentType = testHighlightSet[testHighlightSet.length - 1].contentType;
    expect(screen.getByText(firstContentType)).toBeInTheDocument();
    expect(screen.getByText(lastContentType)).toBeInTheDocument();
  });

  it('Displays multiple organizations', () => {
    renderWithRouter(<ContentHighlightsCardItemsContainerWrapper />);
    const firstContentType = testHighlightSet[0]
      .authoringOrganizations[0].name;
    const lastContentType = testHighlightSet[0]
      .authoringOrganizations[testHighlightSet[0].authoringOrganizations.length - 1].name;
    expect(screen.getByText(firstContentType, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(lastContentType, { exact: false })).toBeInTheDocument();
  });
});