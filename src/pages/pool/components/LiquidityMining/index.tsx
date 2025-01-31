import styled from '@emotion/styled';
import { Dec, IntPretty } from '@keplr-wallet/unit';
import { PricePretty } from '@keplr-wallet/unit/build/price-pretty';
import { observer } from 'mobx-react-lite';
import React, { FunctionComponent, useState } from 'react';
import { Img } from 'src/components/common/Img';
import { ButtonPrimary } from 'src/components/layouts/Buttons';
import { CenterSelf } from 'src/components/layouts/Containers';
import { TitleText, Text } from 'src/components/Texts';
import { ExtraGaugeInPool } from 'src/config';
import { LockLpTokenDialog } from 'src/dialogs';
import useWindowSize from 'src/hooks/useWindowSize';
import { useStore } from 'src/stores';
import { SuperfluidStaking } from '../SuperfluidStaking';
import { ExtraGauge } from './ExtraGauge';
import { MyBondingsTable } from './MyBondingsTable';
import { MySuperfluidUnbondingTable } from './MySuperfluidUnbondingTable';
import { MyUnBondingTable } from './MyUnbondingTable';
import 'dayjs/locale/ru';

interface Props {
	poolId: string;
	isSuperfluidEnabled: boolean;
}

export const LiquidityMining = observer(function LiquidityMining({ poolId, isSuperfluidEnabled }: Props) {
	const { chainStore, queriesStore, accountStore, priceStore } = useStore();

	const { isMobileView } = useWindowSize();

	const account = accountStore.getAccount(chainStore.current.chainId);
	const queries = queriesStore.get(chainStore.current.chainId);

	const poolTotalValueLocked =
		queries.osmosis.queryGammPools
			.getPool(poolId)
			?.computeTotalValueLocked(priceStore, priceStore.getFiatCurrency('usd')!) ??
		new PricePretty(priceStore.getFiatCurrency('usd')!, new Dec(0));
	const totalPoolShare = queries.osmosis.queryGammPools.getPool(poolId)?.totalShare ?? new IntPretty(new Dec(0));
	const myPoolShare = queries.osmosis.queryGammPoolShare.getAvailableGammShare(account.bech32Address, poolId);
	const lockableDurations = queries.osmosis.queryLockableDurations.lockableDurations;

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const closeDialog = () => setIsDialogOpen(false);

	return (
		<>
			<LiquidityMiningContainer>
				<LockLpTokenDialog
					isOpen={isDialogOpen}
					close={closeDialog}
					poolId={poolId}
					isSuperfluidEnabled={isSuperfluidEnabled}
				/>
				<LiquidityMiningSummary>
					<div>
						<div className="pb-4 flex flex-col md:flex-row gap-2.5 md:gap-3 items-start md:items-center">
							<TitleText isMobileView={isMobileView} pb={0} weight="semiBold">
							Добыча ликвидности
							</TitleText>
							{isSuperfluidEnabled && (
								<div className="bg-sfs rounded-full px-4 py-1 text-xs md:text-base">Superfluid Staking включен</div>
							)}
						</div>
						<Text isMobileView={isMobileView}>
							Положить ликвидность на разные сроки чтобы зарабатывать 
							{!isMobileView ? <br /> : ' '}
							премие и обменные сборы 
						</Text>
					</div>
					<AvailableLpColumn>
						<Text isMobileView={isMobileView} pb={12}>
							Доступные токены LP
						</Text>
						<Text isMobileView={isMobileView} pb={16} size="xl" emphasis="high" weight="semiBold">
							{/* TODO: 풀의 TVL을 계산할 수 없는 경우 그냥 코인 그대로 보여줘야할듯... */}
							{!totalPoolShare.toDec().equals(new Dec(0))
								? poolTotalValueLocked.mul(myPoolShare.quo(totalPoolShare)).toString()
								: '$0'}
						</Text>
						<div>
							<ButtonPrimary
								onClick={() => {
									setIsDialogOpen(true);
								}}>
								<Text isMobileView={isMobileView} emphasis="high">
									Начать зарабатывать 
								</Text>
							</ButtonPrimary>
						</div>
					</AvailableLpColumn>
				</LiquidityMiningSummary>
				{(() => {
					let gauges = ExtraGaugeInPool[poolId];
					if (gauges) {
						if (!Array.isArray(gauges)) {
							gauges = [gauges];
						}

						return (
							<div
								style={{
									display: 'flex',
									flexDirection: isMobileView ? 'column' : 'row',
									gap: isMobileView ? '0px' : '36px',
								}}>
								{gauges.map(gauge => {
									const currency = chainStore.currentFluent.findCurrency(gauge.denom);
									const gaugeIds = [gauge.gaugeId];
									if (Array.isArray(gauges)) {
										for (const other of gauges) {
											if (other.gaugeId !== gauge.gaugeId) {
												gaugeIds.push(other.gaugeId);
											}
										}
									}

									if (currency) {
										return (
											<ExtraGauge gaugeIds={gaugeIds} currency={currency} extraRewardAmount={gauge.extraRewardAmount} />
										);
									}
								})}
							</div>
						);
					}
					return null;
				})()}
				<LockDurationSection>
					{lockableDurations.map((lockableDuration, i) => {
						return (
							<LockupBox
								key={i.toString()}
								apy={`${queries.osmosis.queryIncentivizedPools
									.computeAPY(poolId, lockableDuration, priceStore, priceStore.getFiatCurrency('usd')!)
									.toString()}%`}
								duration={lockableDuration.locale('ru').humanize()}
								isMobileView={isMobileView}
								poolId={poolId}
								isSuperfluidEnabled={i === lockableDurations.length - 1 && isSuperfluidEnabled}
							/>
						);
					})}
				</LockDurationSection>
			</LiquidityMiningContainer>
			{isSuperfluidEnabled && (
				<div className="px-5 mt-5 md:px-0 md:mt-0">
					<SuperfluidStaking poolId={poolId} />
				</div>
			)}
			<MyBondingsTable poolId={poolId} isSuperfluidEnabled={isSuperfluidEnabled} />
			<MyUnBondingTable poolId={poolId} />
			{isSuperfluidEnabled && <MySuperfluidUnbondingTable poolId={poolId} />}
		</>
	);
});

const LockupBox: FunctionComponent<{
	poolId: string;
	duration: string;
	apy: string;
	isMobileView: boolean;
	isSuperfluidEnabled?: boolean;
}> = observer(({ poolId, duration, apy, isMobileView, isSuperfluidEnabled }) => {
	const { chainStore, queriesStore } = useStore();

	const queries = queriesStore.get(chainStore.current.chainId);
	const superfluidAPY = isSuperfluidEnabled
		? queries.cosmos.queryInflation.inflation.mul(
				queries.osmosis.querySuperfluidOsmoEquivalent.estimatePoolAPROsmoEquivalentMultiplier(poolId)
		  )
		: new IntPretty(0);

	return (
		<div className={`w-full rounded-xl py-0.5 px-0.5 ${isSuperfluidEnabled ? 'bg-sfs' : 'bg-card'}`}>
			<div className="rounded-xl bg-card py-4 px-5.5 md:py-5.5 md:px-7">
				<div className="pb-4 flex items-center gap-2">
					<TitleText isMobileView={isMobileView} pb={0} weight="medium">
						{duration}
					</TitleText>
					{isSuperfluidEnabled && (
						<div className="w-6 h-6">
							<Img src={'/public/assets/Icons/superfluid-osmo.svg'} />
						</div>
					)}
				</div>
				<Text isMobileView={isMobileView} color="gold" size="lg">
					APR {apy}
					{isSuperfluidEnabled && ` + ${superfluidAPY.maxDecimals(0).toString()}%`}
				</Text>
			</div>
		</div>
	);
});

const LiquidityMiningContainer = styled(CenterSelf)`
	padding: 20px 20px 28px;
	@media (min-width: 768px) {
		padding: 40px 0;
	}
`;

const LiquidityMiningSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 32px;
	@media (min-width: 768px) {
		flex-direction: row;
		justify-content: space-between;
		gap: 0;
	}
`;

const AvailableLpColumn = styled.div`
	display: flex;
	flex-direction: column;
	align-item: flex-start;
	@media (min-width: 768px) {
		align-items: flex-end;
	}
`;

const LockDurationSection = styled.div`
	margin-top: 40px;
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	@media (min-width: 768px) {
		flex-wrap: nowrap;
		gap: 36px;
	}
`;

const TableSection = styled.div`
	padding-top: 40px;
`;
