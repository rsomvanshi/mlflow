import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Modal } from '@databricks/design-system';
import { CopyBox } from '../../../shared/building_blocks/CopyBox';

export const GetLinkModal = ({ visible, onCancel, link }) => {
  return (
        <Modal
          title={
            <FormattedMessage defaultMessage='Get Link' description={'Title text for get-link modal'} />
          }
          visible={visible}
          onCancel={onCancel}
        >
            <CopyBox copyText={link} />
            <p className='create-modal-explanatory-text'>
                <FormattedMessage
                    defaultMessage='To monitor inference metrics.&nbsp;'
                    description='Text for monitoring inference metrics'
                />
                <FormattedMessage
                    defaultMessage='<link>Click here</link>'
                    description='Inference metrics'
                    values={{
                        link: (chunks) => (
                            // Reported during ESLint upgrade
                            // eslint-disable-next-line react/jsx-no-target-blank
                            <a href='https://ops-xpva.kratos.nvidia.com/d/kratos_xp_k8_namespace_pods/kratos-xp-kubernetes-namespace-pods?orgId=1&refresh=30s&var-datasource=Prometheus&var-namespace=kratos-team' target='_blank'>
                                {chunks}
                            </a>
                        ),
                    }}
                />
                .
            </p>
        </Modal>
  );
};

GetLinkModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  link: PropTypes.string.isRequired,
};
