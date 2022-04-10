import { CoinPretty, DecUtils } from '@keplr-wallet/unit';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { OverviewLabelValue } from 'src/components/common/OverviewLabelValue';
import { useStore } from 'src/stores';

export const OsmoPrice = observer(function OsmoPrice() {
	const { chainStore, priceStore } = useStore();

	const price = priceStore.getPricePretty(
		new CoinPretty(
			chainStore.current.stakeCurrency,
			DecUtils.getPrecisionDec(chainStore.current.stakeCurrency.coinDecimals)
		)
	);

	return (
		<OverviewLabelValue label="Курс OSMO">
			<h4 className="text-xl md:text-2xl leading-7 md:leading-none">{price}</h4>
		</OverviewLabelValue>
	);
});
