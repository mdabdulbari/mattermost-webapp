// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react';

import {useIntl} from 'react-intl';

import {useDispatch} from 'react-redux';

import {DispatchFunc} from 'mattermost-redux/types/actions';

import {requestCloudTrial} from 'actions/cloud';

import {trackEvent} from 'actions/telemetry_actions';

import {openModal} from 'actions/views/modals';

import TrialBenefitsModal from 'components/trial_benefits_modal/trial_benefits_modal';

import {ModalIdentifiers, TELEMETRY_CATEGORIES} from 'utils/constants';

export type CloudStartTrialBtnProps = {
    message: string;
    linkStyle?: boolean;
    telemetryId: string;
    onClick?: () => void;
};

enum TrialLoadStatus {
    NotStarted = 'NOT_STARTED',
    Started = 'STARTED',
    Success = 'SUCCESS',
    Failed = 'FAILED',
    Embargoed = 'EMBARGOED',
}

const CloudStartTrialBtn = ({
    message,
    telemetryId,
    linkStyle,
    onClick,
}: CloudStartTrialBtnProps) => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch<DispatchFunc>();

    const [status, setLoadStatus] = useState(TrialLoadStatus.NotStarted);

    const requestLicense = async (): Promise<TrialLoadStatus> => {
        const productUpdated = await requestCloudTrial('start_trial_btn')();
        if (!productUpdated) {
            setLoadStatus(TrialLoadStatus.Failed);
            return TrialLoadStatus.Failed;
        }

        setLoadStatus(TrialLoadStatus.Success);
        return TrialLoadStatus.Success;
    };

    const openTrialBenefitsModal = async (status: TrialLoadStatus) => {
        // Only open the benefits modal if the trial request succeeded
        if (status !== TrialLoadStatus.Success) {
            return;
        }
        await dispatch(openModal({
            modalId: ModalIdentifiers.TRIAL_BENEFITS_MODAL,
            dialogType: TrialBenefitsModal,
            dialogProps: {trialJustStarted: true},
        }));
    };

    const btnText = (status: TrialLoadStatus): string => {
        switch (status) {
        case TrialLoadStatus.Started:
            return formatMessage({id: 'start_cloud_trial.modal.gettingTrial', defaultMessage: 'Getting Trial...'});
        case TrialLoadStatus.Success:
            return formatMessage({id: 'start_cloud_trial.modal.loaded', defaultMessage: 'Loaded!'});
        case TrialLoadStatus.Failed:
            return formatMessage({id: 'start_cloud_trial.modal.failed', defaultMessage: 'Failed'});
        case TrialLoadStatus.Embargoed:
            return formatMessage({id: 'admin.license.trial-request.embargoed'});
        default:
            return message;
        }
    };
    const startCloudTrial = async () => {
        // reading status from here instead of normal flow because
        // by the time the function needs the updated value from requestLicense,
        // it will be too late to wait for the render cycle to happen again
        // to close over the updated value
        const updatedStatus = await requestLicense();
        await openTrialBenefitsModal(updatedStatus);
        if (onClick && updatedStatus === TrialLoadStatus.Success) {
            onClick();
        }
        trackEvent(
            TELEMETRY_CATEGORIES.CLOUD_START_TRIAL_MODAL,
            telemetryId,
        );
    };

    return (
        <button
            className={`CloudStartTrialBtn start-trial-btn ${linkStyle ? 'style-link' : ''}`}
            onClick={startCloudTrial}
        >
            {btnText(status)}
        </button>
    );
};

export default CloudStartTrialBtn;
