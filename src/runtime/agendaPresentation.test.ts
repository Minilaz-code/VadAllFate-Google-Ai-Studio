import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commitmentStatus} from './agendaPresentation.ts';
test('travel is not shown completed merely because departure committed',()=>{assert.equal(commitmentStatus({job:{kind:'ROUTINE_DEPART',status:'COMPLETED'}}),'PENDING');assert.equal(commitmentStatus({job:{kind:'ROUTINE_DEPART',status:'COMPLETED'},arrival:{status:'REJECTED'}}),'REJECTED');});
test('failed original remains rejected when an alternative completes',()=>{assert.equal(commitmentStatus({job:{kind:'ROUTINE_APPOINTMENT',status:'REJECTED'},alternative:{status:'COMPLETED'}}),'REJECTED');});
test('activation and successful arrival are distinct presentation states',()=>{assert.equal(commitmentStatus({job:null}),'NOT ACTIVATED');assert.equal(commitmentStatus({job:{kind:'ROUTINE_DEPART',status:'COMPLETED'},arrival:{status:'COMPLETED'}}),'COMPLETED');});
