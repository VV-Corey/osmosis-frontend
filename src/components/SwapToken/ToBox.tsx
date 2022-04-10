import { Dec } from '@keplr-wallet/unit';
import { observer } from 'mobx-react-lite';
import React, { CSSProperties, HTMLAttributes } from 'react';
import { TokenOutSwapConfig } from 'src/components/SwapToken/models';
import { TokenBoxContainer, TokenBoxRow } from 'src/components/SwapToken/StyledTokenBox';
import { TokenSelect } from 'src/components/SwapToken/TokenSelect';
import { Text, TitleText } from 'src/components/Texts';
import { useBooleanStateWithWindowEvent } from 'src/hooks/useBooleanStateWithWindowEvent';
import useWindowSize from 'src/hooks/useWindowSize';

interface Props extends HTMLAttributes<HTMLDivElement> {
	config: TokenOutSwapConfig;
	dropdownStyle?: CSSProperties;
	dropdownClassName?: string;
}

export const ToBox = observer(function ToBox({ config, dropdownClassName, dropdownStyle, ...props }: Props) {
	const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useBooleanStateWithWindowEvent(false);
	const { isMobileView } = useWindowSize();
	return (
		<TokenBoxContainer {...props}>
			<TokenBoxRow>
				<Text isMobileView={isMobileView} emphasis="medium">
					В
				</Text>
			</TokenBoxRow>
			<TokenBoxRow>
				<TokenSelect
					options={config.sendableCurrencies.filter(
						cur => cur.coinMinimalDenom !== config.sendCurrency.coinMinimalDenom
					)}
					value={config.outCurrency}
					onSelect={appCurrency => config.setOutCurrency(appCurrency.coinMinimalDenom)}
					isDropdownOpen={isTokenDropdownOpen}
					onDropdownOpen={() => setIsTokenDropdownOpen(true)}
					onDropdownClose={() => setIsTokenDropdownOpen(false)}
					dropdownStyle={dropdownStyle}
					dropdownClassName={dropdownClassName}
				/>
				<TitleText
					isMobileView={isMobileView}
					pb={0}
					style={{ opacity: config.outAmount.toDec().equals(new Dec(0)) ? 0.4 : undefined, textAlign: 'right' }}>
					{`≈ ${config.outAmount
						.trim(true)
						.maxDecimals(6)
						.shrink(true)
						.toString()}`}
				</TitleText>
			</TokenBoxRow>
		</TokenBoxContainer>
	);
});
