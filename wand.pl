#!/usr/bin/perl -w
use strict;
use warnings;
$| = 1;
use IPC::Open3;
use File::Spec;
use Symbol qw(gensym);

my $counter = 0;
my $current_nibble = '';
my $total_counter = 0;
my $current_reading = '';
my $good_readings = 0;
my $last_space_time = 0;
my $last_duty_cycle = 0;

my $pid;
my $file = shift; # used to test captures of ir-ctl output
if (defined $file and $file) {
  open INPUT, "<$file" or die $!;
} else {
  my $irctlcmd = "ir-ctl -r";
  open(NULL, ">", File::Spec->devnull);
  $pid = open3(gensym, \*INPUT, ">&NULL", "$irctlcmd");
}

my $DURATION_CUTOFF =  shift || 0.3481; # best results through testing

while( <INPUT> ) { 
  if (m/^(pulse|space|timeout) (\d+)$/) {

    my ($what, $time) = ($1, $2);

    if ($what eq 'pulse') {
      $counter++;
      $total_counter++;

      if ($last_space_time > 0) {
        my $duty_cycle = $last_duty_cycle = $last_space_time + $time;
        my $duration = $time/$duty_cycle;
        #warn int($duration*100) . " " ;
        if ($duration < $DURATION_CUTOFF) {
          $current_nibble .= 0;
        } else {
          $current_nibble .= 1;
        }
      } else {
        # This must be the first pulse in the reading, so assume it's a 0.
        # ir-ctl starts with a pulse, not a space.
        $current_nibble .= 0;
      }
    } elsif ($what eq 'space') {
      $last_space_time = $time;
    } elsif ($what eq 'timeout') {
      if (($total_counter > 0) and ($total_counter < 56)) {
        warn "Reading was short: $total_counter bits\n";
      }
      $counter = $total_counter = 0;
      $current_nibble = '';
      $current_reading = '';
    }
  } else {
    warn "Didn't match anything: $_";
  }

  if ($counter == 4) {
    my $nibble = sprintf("%x", oct("0b$current_nibble"));
    $current_reading .= $nibble;
    $current_nibble = '';
    $counter = 0;
  }
  if ($total_counter == 56) {
    handle_reading($current_reading);
    $current_reading = '';
    $total_counter = 0;
  }

}
warn "Closing\n";
warn "Good readings: $good_readings\n";
if (defined $pid and $pid) {
  close(NULL);
  waitpid($pid, 0);
} else {
  close(INPUT);
}

sub handle_reading {
  my ($input) = @_;
  #warn "Got a whole reading: $input\n";
  if ($input =~ m/(..)(......)(......)/) {
    my $zeroes = $1;
    my $id = $2;
    my $motion = $3; 
    if ($zeroes ne '00') {
      warn "Reading $input didn't start with 00";
      return;
    } 
    $good_readings++;
    print "ID:$id\n";
  } else {
    warn "Didn't get a good ID from $input";
  }
}
