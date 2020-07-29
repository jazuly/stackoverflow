$reduceBalance = \DB::statement("UPDATE users u, packages p
                                SET u.balance  =  u.balance - p.amount
                                    WHERE u.package_id = p.id
                                    AND u.balance  > 0");
// $this->info($reduceBalance);

if ($reduceBalance) {
    $getUserNEBalance = User::where('balance', '<=', 0)->where('package_id', '<>', 1);

    foreach ($getUserNEBalance as $user) {
        $packageName = $user->package();
        $user->update(['package_id' => 1]);

        $trashServer = $user->server()->oldest()->get();
        $serverIdx = $trashServer->count()-1;

        if ($trashServer->count() > 1) {
            $getOldestServer = $user->server()->oldest()->limit($serverIdx)->delete();
        }

        $trashSite = $trashServer[$serverIdx]->site()->get();
        if ($trashSite->count() > 2) {
            $getOldestSite = $trashServer[$serverIdx]->site()->oldest()->limit($trashSite->count()-2)->delete();
        }

        $dataMail = [];
        $dataMail['subject'] = 'Not Enough Balance';
        $dataMail['recepient'] = $user->email;
        $dataMail['name'] = $user->first_name;
        $dataMail['package'] = $packageName->name;

        SendZeroBalance::dispatch($dataMail);
    }
}
