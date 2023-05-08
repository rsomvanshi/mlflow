import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { injectIntl, FormattedMessage } from 'react-intl';
import { Select, Form } from '@databricks/design-system';

class DeployModelFormComponent extends Component {
  static propTypes = {
    intl: PropTypes.shape({ formatMessage: PropTypes.func.isRequired }).isRequired,
    innerRef: PropTypes.any.isRequired,
  };

  paramKeys = ['Small', 'Medium', 'Large'];

  render() {
    return (
      <Form ref={this.props.innerRef} layout='vertical'>
        <Form.Item
          label={this.props.intl.formatMessage({
            defaultMessage: 'Model Deployment Size',
            description: 'Label for model deployment size',
          })}
          name="modelDeploymentSize"
          rules={[
              {
                  required: false,
              },
          ]}
        >
            <Select
                css={styles.select}
                placeholder={
                    <FormattedMessage
                        defaultMessage='Please select deployment size'
                        description='Placeholder text model deployment'
                    />
                }
                value="Medium"
            >
                {this.paramKeys.map((key) => (
                    <Select.Option value={key} key={key}>
                        {key}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>
      </Form>
    );
  }
}

const styles = {
    wrapper: (theme) => ({ padding: `0 ${theme.spacing.xs}px` }),
    select: { width: '100%' },
};
export const DeployModelForm = injectIntl(DeployModelFormComponent);
