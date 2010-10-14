<?php $html->css('viewbets', 'stylesheet', array('inline' => false)); ?>
<h1>View Bets</h1>

<table>
<tr>
	<th>Date</th>
	<th>Home</th>
	<th>Visitor</th>
	<th>League</th>
	<th>Bet Direction</th>
	<th>Bet Type</th>
	<th>Bet</th>
	<th>Risk</th>
	<th>Winnings</th>
	<th>Book</th>
	<th>Delete</th>
	<th>View</th>
</tr>

<?php
$startSS = strtotime('1990-01-01');
foreach ($bets as $bet) :
	$score = $bet['Score'];
	$bet = $bet['UserBet'];
	$game_date = strtotime($bet['game_date']);
	if ($game_date < $startSS) {
		$game_date = strtotime($score['game_date']);
	}
	
?>

<tr>
	<td><?= date("m/d/y", $game_date) ?></td>
	<td><?= $score['home'] ?></td>
	<td><?= $score['visitor'] ?></td>
	<td><?= $score['league'] ?></td>
	<td><?= $bet['direction'] ?></td>
	<td><?= $bet['type'] ?></td>
	<td><?= $bet['bet'] ?></td>
	<td><?= $bet['risk'] ?></td>
	<td><?= $bet['winning'] ?></td>
	<td><?= $bet['source'] ?></td>
	<td><?= $html->link('X', '/bets/delete/'.$bet['id']) ?></td>
	<td><?= $html->link('View', '/score/view/'.$score['id']) ?></td>
</tr>	
<?php
if (!empty($bet['Parlay'])) {
	foreach ($bet['Parlay'] as $parlay) {
		$bet = $parlay['UserBet'];
		$score = $parlay['Score'];
?>
<tr><td>-</td>
	<td><?= $score['home'] ?></td>
	<td><?= $score['visitor'] ?></td>
	<td><?= $score['league'] ?></td>
	<td><?= $bet['direction'] ?></td>
	<td><?= $bet['type'] ?></td>
	<td><?= $bet['bet'] ?></td>
	<td>&nbsp;</td>
	<td>&nbsp;</td>
	<td><?= $bet['source'] ?></td>
	<td>&nbsp;</td>
	<td><?= $html->link('View', '/score/view/'.$score['id']) ?></td>
</tr>
<?php
	}
}
?>

<?php endforeach; // ($bets as $bet) : ?>

</table>
