import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'antd';
import { Link } from 'react-router-dom';
import './ModelListView.css';
import { getModelPageRoute, getModelVersionPageRoute } from '../routes';
import Utils from '../../common/utils/Utils';
import {
  AntdTableSortOrder,
  Stages,
  StageTagComponents,
  EMPTY_CELL_PLACEHOLDER,
  REGISTERED_MODELS_PER_PAGE,
  REGISTERED_MODELS_SEARCH_NAME_FIELD,
  REGISTERED_MODELS_SEARCH_TIMESTAMP_FIELD,
} from '../constants';
import {
  ExperimentSearchSyntaxDocUrl,
  ModelRegistryDocUrl,
  ModelRegistryOnboardingString,
  onboarding,
} from '../../common/constants';
import { SimplePagination } from '../../common/components/SimplePagination';
import { Spinner } from '../../common/components/Spinner';
import { CreateModelButton } from './CreateModelButton';
import LocalStorageUtils from '../../common/utils/LocalStorageUtils';
import { CollapsibleTagsCell } from '../../common/components/CollapsibleTagsCell';
import { RegisteredModelTag } from '../sdk/ModelRegistryMessages';
import { PageHeader } from '../../shared/building_blocks/PageHeader';
import { FlexBar } from '../../shared/building_blocks/FlexBar';
import { Spacer } from '../../shared/building_blocks/Spacer';
import { SearchBox } from '../../shared/building_blocks/SearchBox';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
  Alert,
  Button,
  InfoIcon,
  Popover,
  QuestionMarkFillIcon,
  Spacer as DuBoisSpacer,
} from '@databricks/design-system';
import { ModelListFilters } from './model-list/ModelListFilters';
import { ModelListTable } from './model-list/ModelListTable';
import { shouldUseUnifiedListPattern } from '../../common/utils/FeatureUtils';
import { PageContainer } from '../../common/components/PageContainer';
import {RenameExperimentModal} from "../../experiment-tracking/components/modals/RenameExperimentModal";
import {GetLinkModal} from "../../experiment-tracking/components/modals/GetLinkModal";
import {DeployModelModal} from "./model-list/DeployModelModal";

const NAME_COLUMN_INDEX = 'name';
const LAST_MODIFIED_COLUMN_INDEX = 'last_updated_timestamp';

const getOverallLatestVersionNumber = (latest_versions) =>
  latest_versions && Math.max(...latest_versions.map((v) => v.version));

const RadioCheckbox = () => {
  return <input type='radio' onChange={handleSelectedRadioChange} value='test' checked={false} />;
};

const handleSelectedRadioChange = () => {
  console.log('************************************');
  console.log('testing');
  console.log('************************************');
};

const getLatestVersionNumberByStage = (latest_versions, stage) => {
  const modelVersion = latest_versions && latest_versions.find((v) => v.current_stage === stage);
  return modelVersion && modelVersion.version;
};

export class ModelListViewImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      lastNavigationActionWasClickPrev: false,
      maxResultsSelection: REGISTERED_MODELS_PER_PAGE,
      showOnboardingHelper: this.showOnboardingHelper(),
      selectedModelName: undefined,
      showLinkModal: false,
      showDeployModelModal: false,
      showLoader: false,
    };
  }

  static propTypes = {
    models: PropTypes.array.isRequired,
    searchInput: PropTypes.string.isRequired,
    orderByKey: PropTypes.string.isRequired,
    orderByAsc: PropTypes.bool.isRequired,
    currentPage: PropTypes.number.isRequired,
    // To know if there is a next page. If null, there is no next page. If undefined, we haven't
    // gotten an answer from the backend yet.
    nextPageToken: PropTypes.string,
    loading: PropTypes.bool,
    onSearch: PropTypes.func.isRequired,
    onSearchInputChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onClickNext: PropTypes.func.isRequired,
    onClickPrev: PropTypes.func.isRequired,
    onClickSortableColumn: PropTypes.func.isRequired,
    onSetMaxResult: PropTypes.func.isRequired,
    getMaxResultValue: PropTypes.func.isRequired,
    intl: PropTypes.any,
  };

  static defaultProps = {
    models: [],
    searchInput: '',
  };

  showOnboardingHelper() {
    const onboardingInformationStore = ModelListViewImpl.getLocalStore(onboarding);
    return onboardingInformationStore.getItem('showRegistryHelper') === null;
  }

  disableOnboardingHelper() {
    const onboardingInformationStore = ModelListViewImpl.getLocalStore(onboarding);
    onboardingInformationStore.setItem('showRegistryHelper', 'false');
  }

  /**
   * Returns a LocalStorageStore instance that can be used to persist data associated with the
   * ModelRegistry component.
   */
  static getLocalStore(key) {
    return LocalStorageUtils.getStoreForComponent('ModelListView', key);
  }

  componentDidMount() {
    const pageTitle = 'MLflow Models';
    Utils.updatePageTitle(pageTitle);
  }

  renderModelVersionLink(name, versionNumber) {
    return (
      <FormattedMessage
        defaultMessage='<link>Version {versionNumber}</link>'
        description='Row entry for version columns in the registered model page'
        values={{
          versionNumber: versionNumber,
          link: (chunks) => (
            <Link to={getModelVersionPageRoute(name, versionNumber)}>{chunks}</Link>
          ),
        }}
      />
    );
  }

  getSortOrder = (key) => {
    const { orderByKey, orderByAsc } = this.props;
    if (key !== orderByKey) {
      return null;
    }
    return { sortOrder: orderByAsc ? AntdTableSortOrder.ASC : AntdTableSortOrder.DESC };
  };

  handleCellToggle = () => {
    this.forceUpdate();
  };

  getColumns = () => {
    const columns = [
      // {
      //   title: this.props.intl.formatMessage({
      //     defaultMessage: 'Select',
      //     description: 'Select model to deploy',
      //   }),
      //   width: '2%',
      //   render: () => {
      //     return <RadioCheckbox />;
      //   },
      // },
      {
        title: this.props.intl.formatMessage({
          defaultMessage: 'Name',
          description: 'Column title for model name in the registered model page',
        }),
        className: 'model-name',
        dataIndex: NAME_COLUMN_INDEX,
        render: (text, row) => {
          return <Link to={getModelPageRoute(row.name)}>{text}</Link>;
        },
        sorter: true,
        ...this.getSortOrder(REGISTERED_MODELS_SEARCH_NAME_FIELD),
      },
      {
        title: this.props.intl.formatMessage({
          defaultMessage: 'Latest Version',
          description: 'Column title for latest model version in the registered model page',
        }),
        className: 'latest-version',
        render: ({ name, latest_versions }) => {
          const versionNumber = getOverallLatestVersionNumber(latest_versions);
          return versionNumber
            ? this.renderModelVersionLink(name, versionNumber)
            : EMPTY_CELL_PLACEHOLDER;
        },
      },
      {
        title: StageTagComponents[Stages.STAGING],
        className: 'latest-staging',
        render: ({ name, latest_versions }) => {
          const versionNumber = getLatestVersionNumberByStage(latest_versions, Stages.STAGING);
          return versionNumber
            ? this.renderModelVersionLink(name, versionNumber)
            : EMPTY_CELL_PLACEHOLDER;
        },
      },
      {
        title: StageTagComponents[Stages.PRODUCTION],
        className: 'latest-production',
        render: ({ name, latest_versions }) => {
          const versionNumber = getLatestVersionNumberByStage(latest_versions, Stages.PRODUCTION);
          return versionNumber
            ? this.renderModelVersionLink(name, versionNumber)
            : EMPTY_CELL_PLACEHOLDER;
        },
      },
      {
        title: this.props.intl.formatMessage({
          defaultMessage: 'Last Modified',
          description:
            'Column title for last modified timestamp for a model in the registered model page',
        }),
        className: 'last-modified',
        dataIndex: LAST_MODIFIED_COLUMN_INDEX,
        render: (text, row) => <span>{Utils.formatTimestamp(row.last_updated_timestamp)}</span>,
        sorter: true,
        ...this.getSortOrder(REGISTERED_MODELS_SEARCH_TIMESTAMP_FIELD),
      },
      {
        title: this.props.intl.formatMessage({
          defaultMessage: 'Tags',
          description: 'Column title for model tags in the registered model page',
        }),
        className: 'table-tag-container',
        render: (row, index) => {
          return index.tags && index.tags.length > 0 ? (
            <div style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
              <CollapsibleTagsCell
                tags={{ ...index.tags.map((tag) => RegisteredModelTag.fromJs(tag)) }}
                onToggle={this.handleCellToggle}
              />
            </div>
          ) : (
            EMPTY_CELL_PLACEHOLDER
          );
        },
      },
    ];
    return columns;
  };

  getRowKey = (record) => record.name;

  setLoadingFalse = () => {
    this.setState({ loading: false });
  };

  handleSearch = (event, searchInput) => {
    event?.preventDefault();
    this.setState({ loading: true, lastNavigationActionWasClickPrev: false });
    this.props.onSearch(this.setLoadingFalse, this.setLoadingFalse, searchInput);
  };

  static getSortFieldName = (column) => {
    switch (column) {
      case NAME_COLUMN_INDEX:
        return REGISTERED_MODELS_SEARCH_NAME_FIELD;
      case LAST_MODIFIED_COLUMN_INDEX:
        return REGISTERED_MODELS_SEARCH_TIMESTAMP_FIELD;
      default:
        return null;
    }
  };

  unifiedTableSortChange = ({ orderByKey, orderByAsc }) => {
    // Different column keys are used for sorting and data accessing,
    // mapping to proper keys happens below
    const fieldMappedToSortKey =
      {
        timestamp: 'last_updated_timestamp',
      }[orderByKey] || orderByKey;

    this.handleTableChange(undefined, undefined, {
      field: fieldMappedToSortKey,
      order: orderByAsc ? 'undefined' : 'descend',
    });
  };

  handleTableChange = (pagination, filters, sorter) => {
    this.setState({ loading: true, lastNavigationActionWasClickPrev: false });
    this.props.onClickSortableColumn(
      ModelListViewImpl.getSortFieldName(sorter.field),
      sorter.order,
      this.setLoadingFalse,
      this.setLoadingFalse,
    );
  };

  renderOnboardingContent(isUnifiedListPattern = false) {
    const learnMoreLinkUrl = ModelListViewImpl.getLearnMoreLinkUrl();
    const learnMoreDisplayString = ModelListViewImpl.getLearnMoreDisplayString();
    const content = (
      <>
        {learnMoreDisplayString}{' '}
        <FormattedMessage
          defaultMessage='<link>Learn more</link>'
          description='Learn more link on the model list page with cloud-specific link'
          values={{
            link: (chunks) => (
              <a
                href={learnMoreLinkUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='LinkColor'
              >
                {chunks}
              </a>
            ),
          }}
        />
      </>
    );

    if (isUnifiedListPattern) {
      return (
        <Popover content={content}>
          <InfoIcon css={{ cursor: 'pointer' }} />
        </Popover>
      );
    }

    return this.state.showOnboardingHelper ? (
      <div>
        <Alert message={content} type='info' onClose={() => this.disableOnboardingHelper()} />
        <DuBoisSpacer />
      </div>
    ) : null;
  }

  getEmptyTextComponent() {
    const { searchInput } = this.props;
    const { lastNavigationActionWasClickPrev } = this.state;
    // Handle the case when emptiness is caused by search filter
    if (searchInput) {
      if (lastNavigationActionWasClickPrev) {
        return (
          'No models found for the page. Please refresh the page as the underlying data may ' +
          'have changed significantly.'
        );
      } else {
        return 'No models found.';
      }
    }
    return (
      <div>
        <span>
          <FormattedMessage
            defaultMessage='No models yet. <link>Create a model</link> to get started.'
            description='Placeholder text for empty models table in the registered model list page'
            values={{
              link: (chunks) => <CreateModelButton buttonType='link' buttonText={chunks} />,
            }}
          />
        </span>
      </div>
    );
  }

  static getLearnMoreLinkUrl = () => ModelRegistryDocUrl;

  static getLearnMoreDisplayString = () => ModelRegistryOnboardingString;

  handleClickNext = () => {
    this.setState({ loading: true, lastNavigationActionWasClickPrev: false });
    this.props.onClickNext(this.setLoadingFalse, this.setLoadingFalse);
  };

  handleClickPrev = () => {
    this.setState({ loading: true, lastNavigationActionWasClickPrev: true });
    this.props.onClickPrev(this.setLoadingFalse, this.setLoadingFalse);
  };

  handleSetMaxResult = ({ item, key, keyPath, domEvent }) => {
    this.setState({ loading: true });
    this.props.onSetMaxResult(key, this.setLoadingFalse, this.setLoadingFalse);
  };

  handleSearchInput = (event) => {
    this.props.onSearchInputChange(event.target.value);
  };

  handleClear = () => {
    this.props.onClear(this.setLoadingFalse, this.setLoadingFalse);
  };

  handleDeployModel = (modelName) => () => {
    this.setState({
      showDeployModelModal: true,
    });
  };

  handleDeployModelModalClose = () => {
    this.setState({
      showDeployModelModal: false,
    });
  };

  handleDeployModelModalSubmit = () => {
    this.setState({
      showLoader: true,
    });
    this.closeLoaderIn5Seconds();
  };

  closeLoaderIn5Seconds = () => {
      setTimeout(() => {
        this.setState({
          showLoader: false,
          showDeployModelModal: false,
          showLinkModal: true
        });
      }, 5000);
  };

  setShowGetLinkModal = (value) => () => {
    this.setState({showLinkModal: value});
  };
  searchInputHelpTooltipContent = () => {
    return (
      <div className='search-input-tooltip-content'>
        <FormattedMessage
          // eslint-disable-next-line max-len
          defaultMessage='To search by tags or by names and tags, use a simplified version{newline}of the SQL {whereBold} clause.'
          description='Tooltip string to explain how to search models from the model registry table'
          values={{ newline: <br />, whereBold: <b>WHERE</b> }}
        />{' '}
        <FormattedMessage
          defaultMessage='<link>Learn more</link>'
          description='Learn more tooltip link to learn more on how to search models'
          values={{
            link: (chunks) => (
              <a
                href={ExperimentSearchSyntaxDocUrl + '#syntax'}
                target='_blank'
                rel='noopener noreferrer'
              >
                {chunks}
              </a>
            ),
          }}
        />
        <br />
        <FormattedMessage
          defaultMessage='Examples:'
          description='Text header for examples of mlflow search syntax'
        />
        <br />
        {'• tags.my_key = "my_value"'}
        <br />
        {'• name ilike "%my_model_name%" and tags.my_key = "my_value"'}
      </div>
    );
  };

  render() {
    // prettier-ignore
    const {
      models,
      currentPage,
      nextPageToken,
      searchInput,
    } = this.props;
    const { loading } = this.state;
    const isUnifiedListPattern = shouldUseUnifiedListPattern();

    const paginationComponent = (
      <SimplePagination
        currentPage={currentPage}
        isLastPage={nextPageToken === null}
        onClickNext={this.handleClickNext}
        onClickPrev={this.handleClickPrev}
        handleSetMaxResult={this.handleSetMaxResult}
        maxResultOptions={[String(REGISTERED_MODELS_PER_PAGE), '25', '50', '100']}
        getSelectedPerPageSelection={this.props.getMaxResultValue}
      />
    );

    // Determine if we use any filters at the moment
    const isFiltered =
      // prettier-ignore
      Boolean(searchInput);

    const title = (
      <FormattedMessage
        defaultMessage='Registered Models'
        description='Header for displaying models in the model registry'
      />
    );
    const rowSelection = {
      onChange: (selectedRowKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
        this.setState({
          selectedModelName: selectedRows[0].name,
        })
      },
      getCheckboxProps: (record) => ({
        disabled: record.name === 'Disabled User', // Column configuration not to be checked
        name: record.name,
      })
    };
    return (
      <PageContainer data-test-id='ModelListView-container' usesFullHeight={isUnifiedListPattern}>
        <div>
          <PageHeader
            title={
              <>
                {title} {isUnifiedListPattern && this.renderOnboardingContent(true)}
              </>
            }
          >
            <></>
            {isUnifiedListPattern && <CreateModelButton />}
          </PageHeader>
          {!isUnifiedListPattern && this.renderOnboardingContent(false)}
          {/* If unified list pattern is supported, display new version of filters */}
          {isUnifiedListPattern ? (
            <ModelListFilters
              searchFilter={this.props.searchInput}
              onSearchFilterChange={(value) => this.handleSearch(null, value)}
              isFiltered={isFiltered}
            />
          ) : (
            <div css={styles.searchFlexBar}>
              <FlexBar
                left={
                  <Spacer size='small' direction='horizontal'>
                    <CreateModelButton />
                  </Spacer>
                }
                right={
                  <Spacer direction='horizontal' size='small'>
                    <Spacer direction='horizontal' size='large'>
                      <Popover
                        overlayClassName='search-input-tooltip'
                        content={this.searchInputHelpTooltipContent()}
                        placement='bottom'
                      >
                        <QuestionMarkFillIcon css={{ cursor: 'pointer' }} />
                      </Popover>
                    </Spacer>

                    <Spacer direction='horizontal' size='large'>
                      <div css={styles.nameSearchBox}>
                        <SearchBox
                          onChange={this.handleSearchInput}
                          value={this.props.searchInput}
                          onSearch={this.handleSearch}
                          placeholder={this.props.intl.formatMessage({
                            defaultMessage: 'Search by model names or tags',
                            description: 'Placeholder text inside model search bar',
                          })}
                        />
                      </div>
                      <Button
                          data-test-id='deploy-button'
                          disabled={!this.state.selectedModelName}
                          onClick={this.handleDeployModel(this.state.selectedModelName)}
                      >
                        <FormattedMessage
                            defaultMessage='Deploy'
                            // eslint-disable-next-line max-len
                            description='Deploy the selected model'
                        />
                      </Button>
                      <Button
                        data-test-id='clear-button'
                        onClick={this.handleClear}
                        disabled={this.props.searchInput === ''}
                      >
                        <FormattedMessage
                          defaultMessage='Clear'
                          // eslint-disable-next-line max-len
                          description='String for the clear button to clear the text for searching models'
                        />
                      </Button>
                    </Spacer>
                  </Spacer>
                }
              />
            </div>
          )}
        </div>
        {/* If unified list pattern is supported, display new table version */}
        {isUnifiedListPattern ? (
          <ModelListTable
            modelsData={models}
            onSortChange={this.unifiedTableSortChange}
            orderByKey={this.props.orderByKey}
            orderByAsc={this.props.orderByAsc}
            isLoading={loading}
            pagination={paginationComponent}
            isFiltered={isFiltered}
          />
        ) : (
          <>
            <DeployModelModal
              isOpen={this.state.showDeployModelModal}
              onClose={this.handleDeployModelModalClose}
              handleSubmit={this.handleDeployModelModalSubmit}
              showLoader={this.state.showLoader}
            />
            <GetLinkModal
                link={`https://xp-inference.kratos.nvidia.com/seldon/kratos-team/${this.state.selectedModelName}/v2/models/infer`}
                visible={this.state.showLinkModal}
                onCancel={this.setShowGetLinkModal(false)}
            />
            <Table
                rowSelection={{
                type: "radio",
                ...rowSelection,
                }}
              size='middle'
              rowKey={this.getRowKey}
              className='model-version-table'
              dataSource={models}
              columns={this.getColumns()}
              locale={{ emptyText: this.getEmptyTextComponent() }}
              pagination={{
                hideOnSinglePage: true,
                pageSize: this.props.getMaxResultValue(),
              }}
              loading={loading && { indicator: <Spinner /> }}
              onChange={this.handleTableChange}
              showSorterTooltip={false}
            />
            <div>
              <DuBoisSpacer />
              <SimplePagination
                currentPage={currentPage}
                isLastPage={nextPageToken === null}
                onClickNext={this.handleClickNext}
                onClickPrev={this.handleClickPrev}
                handleSetMaxResult={this.handleSetMaxResult}
                maxResultOptions={[String(REGISTERED_MODELS_PER_PAGE), '25', '50', '100']}
                getSelectedPerPageSelection={this.props.getMaxResultValue}
              />
            </div>
          </>
        )}
      </PageContainer>
    );
  }
}

export const ModelListView = injectIntl(ModelListViewImpl);

const styles = {
  nameSearchBox: {
    width: '446px',
  },
  searchFlexBar: {
    marginBottom: '24px',
  },
  questionMark: {
    marginLeft: 4,
    cursor: 'pointer',
    color: '#888',
  },
};
